// Unified Data Service for Salon Jobs India App
// Handles data persistence with localStorage (offline) and API (online with MongoDB)

const STORAGE_KEYS = {
  USERS: 'salonjobsindia_users',
  JOB_SEEKERS: 'salonjobsindia_job_seekers',
  SALON_OWNERS: 'salonjobsindia_salon_owners',
  JOBS: 'salonjobsindia_jobs',
  APPLICATIONS: 'salonjobsindia_applications',
  SUBSCRIPTIONS: 'salonjobsindia_subscriptions',
  PAYMENTS: 'salonjobsindia_payments',
  CONVERSATIONS: 'salonjobsindia_conversations',
  NOTIFICATIONS: 'salonjobsindia_notifications',
  CURRENT_USER: 'salonjobsindia_current_user',
  AUTH_TOKEN: 'salonjobsindia_auth_token',
}

// Types
export interface User {
  id: string
  name: string
  email: string
  phone: string
  password?: string // Only stored locally, hashed in production
  role: 'job_seeker' | 'salon_owner' | 'employer' | 'admin'
  isSubscribed: boolean
  subscriptionPlan?: string
  subscriptionExpiry?: string
  createdAt: string
  updatedAt: string
}

export interface JobSeeker {
  id: string
  userId: string
  name: string
  role: string
  dateOfBirth: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: {
    lat: number
    lng: number
    address: string
  }
  identityProof: {
    type: string
    fileUrl?: string
    verified: boolean
  }
  passportPhotoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface SalonOwner {
  id: string
  userId: string
  salonName: string
  ownerName: string
  phone: string
  email: string
  address: string
  location: {
    lat: number
    lng: number
  }
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  ownerId: string
  salonName: string
  salonMobile: string
  role: string
  customRole?: string
  description: string
  requirements: string[]
  salary: string
  experience: string
  location: {
    lat: number
    lng: number
    address: string
  }
  status: 'draft' | 'payment_pending' | 'pending_approval' | 'approved' | 'live' | 'rejected'
  paymentId?: string
  paymentScreenshot?: string
  isActive: boolean
  applicants: string[]
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId: string
  userType: 'job_seeker' | 'salon_owner' | 'employer'
  plan: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  paymentScreenshot?: string
  transactionId?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  userId: string
  type: 'subscription' | 'job_post'
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  screenshotUrl?: string
  transactionId?: string
  processedBy?: string
  processedAt?: string
  rejectionReason?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'job' | 'message' | 'subscription' | 'payment_approved' | 'payment_rejected' | 'system'
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    // Dispatch event for real-time sync
    window.dispatchEvent(new CustomEvent('fitone_data_updated', { detail: { key } }))
  } catch (error) {
    console.error('Storage save error:', error)
  }
}

function getItemFromStorage<T extends { id: string }>(key: string, id: string): T | null {
  const items = getFromStorage<T>(key)
  return items.find(item => item.id === id) || null
}

function updateInStorage<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getFromStorage<T>(key)
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return null
  
  items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() }
  saveToStorage(key, items)
  return items[index]
}

// ===================
// USER SERVICE
// ===================
export const UserService = {
  // Register a new user
  register: async (userData: {
    name: string
    email: string
    phone: string
    password: string
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS)
    
    // Check if email exists
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'Email already registered. Please sign in.' }
    }
    
    // Check if phone exists
    if (users.find(u => u.phone === userData.phone)) {
      return { success: false, error: 'Phone number already registered. Please sign in.' }
    }
    
    const now = new Date().toISOString()
    const newUser: User = {
      id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      phone: userData.phone,
      password: userData.password, // In production, this should be hashed
      role: 'job_seeker', // Default, will be updated in role selection
      isSubscribed: false,
      createdAt: now,
      updatedAt: now,
    }
    
    users.push(newUser)
    saveToStorage(STORAGE_KEYS.USERS, users)
    
    // Save session
    const { password: _, ...userWithoutPassword } = newUser
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword))
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `token_${newUser.id}_${Date.now()}`)
    
    return { success: true, user: userWithoutPassword as User }
  },
  
  // Login user
  login: async (credentials: {
    email: string
    phone: string
    password: string
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS)
    
    const user = users.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase()
    )
    
    if (!user) {
      return { success: false, error: 'No account found with this email. Please sign up.' }
    }
    
    if (user.password !== credentials.password) {
      return { success: false, error: 'Invalid password. Please try again.' }
    }
    
    if (user.phone !== credentials.phone) {
      return { success: false, error: 'Phone number does not match. Please check and try again.' }
    }
    
    // Save session
    const { password: _, ...userWithoutPassword } = user
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword))
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `token_${user.id}_${Date.now()}`)
    
    return { success: true, user: userWithoutPassword as User }
  },
  
  // Get current logged in user
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },
  
  // Update user
  updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const user = updateInStorage<User>(STORAGE_KEYS.USERS, userId, updates)
    if (user) {
      const { password: _, ...userWithoutPassword } = user
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword))
    }
    return user
  },
  
  // Logout
  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  },
  
  // Get user by ID
  getById: (userId: string): User | null => {
    return getItemFromStorage<User>(STORAGE_KEYS.USERS, userId)
  },
  
  // Get all users (admin only)
  getAll: (): User[] => {
    return getFromStorage<User>(STORAGE_KEYS.USERS)
  },
  
  // Get stats
  getStats: () => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS)
    const jobSeekers = users.filter(u => u.role === 'job_seeker')
    const salonOwners = users.filter(u => u.role === 'salon_owner' || u.role === 'employer')
    const subscribedUsers = users.filter(u => u.isSubscribed)
    
    return {
      totalUsers: users.length,
      jobSeekers: jobSeekers.length,
      salonOwners: salonOwners.length,
      subscribedUsers: subscribedUsers.length,
    }
  }
}

// ===================
// JOB SEEKER SERVICE
// ===================
export const JobSeekerService = {
  create: async (data: Omit<JobSeeker, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobSeeker> => {
    const jobSeekers = getFromStorage<JobSeeker>(STORAGE_KEYS.JOB_SEEKERS)
    const now = new Date().toISOString()
    
    const newJobSeeker: JobSeeker = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    
    jobSeekers.push(newJobSeeker)
    saveToStorage(STORAGE_KEYS.JOB_SEEKERS, jobSeekers)
    
    return newJobSeeker
  },
  
  getByUserId: (userId: string): JobSeeker | null => {
    const jobSeekers = getFromStorage<JobSeeker>(STORAGE_KEYS.JOB_SEEKERS)
    return jobSeekers.find(js => js.userId === userId) || null
  },
  
  update: async (id: string, updates: Partial<JobSeeker>): Promise<JobSeeker | null> => {
    return updateInStorage<JobSeeker>(STORAGE_KEYS.JOB_SEEKERS, id, updates)
  },
  
  getAll: (filters?: { role?: string; location?: string; limit?: number; offset?: number }): JobSeeker[] => {
    let jobSeekers = getFromStorage<JobSeeker>(STORAGE_KEYS.JOB_SEEKERS)
    
    if (filters?.role) {
      jobSeekers = jobSeekers.filter(js => js.role.toLowerCase().includes(filters.role!.toLowerCase()))
    }
    
    if (filters?.location) {
      jobSeekers = jobSeekers.filter(js => 
        js.location.address.toLowerCase().includes(filters.location!.toLowerCase())
      )
    }
    
    const offset = filters?.offset || 0
    const limit = filters?.limit || 20
    
    return jobSeekers.slice(offset, offset + limit)
  },
  
  getCount: (): number => {
    return getFromStorage<JobSeeker>(STORAGE_KEYS.JOB_SEEKERS).length
  }
}

// ===================
// JOB SERVICE
// ===================
export const JobService = {
  create: async (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicants'>): Promise<Job> => {
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    const now = new Date().toISOString()
    
    const newJob: Job = {
      ...data,
      id: generateId(),
      applicants: [],
      createdAt: now,
      updatedAt: now,
    }
    
    jobs.push(newJob)
    saveToStorage(STORAGE_KEYS.JOBS, jobs)
    
    return newJob
  },
  
  getById: (jobId: string): Job | null => {
    return getItemFromStorage<Job>(STORAGE_KEYS.JOBS, jobId)
  },
  
  update: async (id: string, updates: Partial<Job>): Promise<Job | null> => {
    return updateInStorage<Job>(STORAGE_KEYS.JOBS, id, updates)
  },
  
  getByOwnerId: (ownerId: string): Job[] => {
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    return jobs.filter(j => j.ownerId === ownerId)
  },
  
  getLiveJobs: (filters?: { role?: string; location?: string; limit?: number }): Job[] => {
    let jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    jobs = jobs.filter(j => j.status === 'live' && j.isActive)
    
    if (filters?.role) {
      jobs = jobs.filter(j => 
        j.role.toLowerCase().includes(filters.role!.toLowerCase()) ||
        j.customRole?.toLowerCase().includes(filters.role!.toLowerCase())
      )
    }
    
    if (filters?.limit) {
      jobs = jobs.slice(0, filters.limit)
    }
    
    return jobs
  },
  
  getPendingApproval: (): Job[] => {
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    return jobs.filter(j => j.status === 'pending_approval')
  },
  
  applyToJob: async (jobId: string, seekerId: string): Promise<boolean> => {
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    const index = jobs.findIndex(j => j.id === jobId)
    
    if (index === -1) return false
    
    if (!jobs[index].applicants.includes(seekerId)) {
      jobs[index].applicants.push(seekerId)
      jobs[index].updatedAt = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.JOBS, jobs)
    }
    
    return true
  },
  
  getStats: () => {
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    return {
      total: jobs.length,
      live: jobs.filter(j => j.status === 'live').length,
      pending: jobs.filter(j => j.status === 'pending_approval').length,
      draft: jobs.filter(j => j.status === 'draft').length,
    }
  }
}

// ===================
// SUBSCRIPTION SERVICE
// ===================
export const SubscriptionService = {
  create: async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> => {
    const subscriptions = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS)
    const now = new Date().toISOString()
    
    const newSubscription: Subscription = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    
    subscriptions.push(newSubscription)
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions)
    
    return newSubscription
  },
  
  getByUserId: (userId: string): Subscription | null => {
    const subscriptions = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS)
    // Get the most recent active subscription
    const userSubs = subscriptions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return userSubs[0] || null
  },
  
  update: async (id: string, updates: Partial<Subscription>): Promise<Subscription | null> => {
    const subscription = updateInStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS, id, updates)
    
    // If subscription is approved, update user's subscription status
    if (subscription && updates.status === 'approved') {
      await UserService.updateUser(subscription.userId, {
        isSubscribed: true,
        subscriptionPlan: subscription.plan,
        subscriptionExpiry: subscription.expiresAt,
      })
      
      // Create notification
      await NotificationService.create({
        userId: subscription.userId,
        type: 'payment_approved',
        title: 'Subscription Activated',
        message: `Your ${subscription.plan} plan is now active! Enjoy premium features.`,
        isRead: false,
      })
    }
    
    return subscription
  },
  
  getPending: (): Subscription[] => {
    const subscriptions = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS)
    return subscriptions.filter(s => s.status === 'pending')
  },
  
  getAll: (): Subscription[] => {
    return getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS)
  }
}

// ===================
// PAYMENT SERVICE
// ===================
export const PaymentService = {
  create: async (data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
    
    const newPayment: Payment = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    
    payments.push(newPayment)
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments)
    
    return newPayment
  },
  
  update: async (id: string, updates: Partial<Payment>): Promise<Payment | null> => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
    const index = payments.findIndex(p => p.id === id)
    
    if (index === -1) return null
    
    payments[index] = { ...payments[index], ...updates }
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments)
    
    return payments[index]
  },
  
  getPending: (): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
    return payments.filter(p => p.status === 'pending')
  },
  
  getByUserId: (userId: string): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
    return payments.filter(p => p.userId === userId)
  }
}

// ===================
// NOTIFICATION SERVICE
// ===================
export const NotificationService = {
  create: async (data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    
    const newNotification: Notification = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    
    notifications.unshift(newNotification) // Add to beginning
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
    
    return newNotification
  },
  
  getByUserId: (userId: string): Notification[] => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    return notifications.filter(n => n.userId === userId)
  },
  
  markAsRead: async (id: string): Promise<void> => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    const index = notifications.findIndex(n => n.id === id)
    
    if (index !== -1) {
      notifications[index].isRead = true
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
    }
  },
  
  markAllAsRead: async (userId: string): Promise<void> => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    
    notifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true
      }
    })
    
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
  },
  
  getUnreadCount: (userId: string): number => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    return notifications.filter(n => n.userId === userId && !n.isRead).length
  }
}

// ===================
// REAL-TIME SYNC
// ===================
export const SyncService = {
  // Subscribe to data changes
  subscribe: (key: string, callback: (data: unknown) => void): () => void => {
    const handler = (event: CustomEvent<{ key: string }>) => {
      if (event.detail.key === key || key === '*') {
        callback(getFromStorage(event.detail.key))
      }
    }
    
    window.addEventListener('fitone_data_updated', handler as EventListener)
    
    return () => {
      window.removeEventListener('fitone_data_updated', handler as EventListener)
    }
  },
  
  // Force sync (pull latest data)
  sync: async (): Promise<void> => {
    // In localStorage mode, just dispatch update events
    Object.values(STORAGE_KEYS).forEach(key => {
      window.dispatchEvent(new CustomEvent('fitone_data_updated', { detail: { key } }))
    })
  }
}

// ===================
// ADMIN SERVICE
// ===================
export const AdminService = {
  // Get dashboard stats
  getDashboardStats: () => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS)
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS)
    const subscriptions = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS)
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
    
    return {
      totalUsers: users.length,
      jobSeekers: users.filter(u => u.role === 'job_seeker').length,
      salonOwners: users.filter(u => u.role === 'salon_owner' || u.role === 'employer').length,
      totalJobs: jobs.length,
      liveJobs: jobs.filter(j => j.status === 'live').length,
      pendingJobApprovals: jobs.filter(j => j.status === 'pending_approval').length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'approved').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      totalRevenue: payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0),
    }
  },
  
  // Approve job post
  approveJob: async (jobId: string, adminId: string): Promise<Job | null> => {
    const job = await JobService.update(jobId, {
      status: 'approved',
    })
    
    if (job) {
      // Notify salon owner
      await NotificationService.create({
        userId: job.ownerId,
        type: 'payment_approved',
        title: 'Job Post Approved',
        message: `Your job post for "${job.role || job.customRole}" has been approved! You can now publish it.`,
        isRead: false,
        data: { jobId: job.id },
      })
    }
    
    return job
  },
  
  // Reject job post
  rejectJob: async (jobId: string, adminId: string, reason: string): Promise<Job | null> => {
    const job = await JobService.update(jobId, {
      status: 'rejected',
    })
    
    if (job) {
      // Notify salon owner
      await NotificationService.create({
        userId: job.ownerId,
        type: 'payment_rejected',
        title: 'Job Post Rejected',
        message: `Your job post was rejected. Reason: ${reason}`,
        isRead: false,
        data: { jobId: job.id, reason },
      })
    }
    
    return job
  },
  
  // Approve subscription
  approveSubscription: async (subscriptionId: string, adminId: string): Promise<Subscription | null> => {
    return await SubscriptionService.update(subscriptionId, {
      status: 'approved',
    })
  },
  
  // Reject subscription
  rejectSubscription: async (subscriptionId: string, adminId: string, reason: string): Promise<Subscription | null> => {
    const subscription = updateInStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS, subscriptionId, {
      status: 'rejected',
    })
    
    if (subscription) {
      // Notify user
      await NotificationService.create({
        userId: subscription.userId,
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your subscription payment was rejected. Reason: ${reason}`,
        isRead: false,
      })
    }
    
    return subscription
  }
}

// Export storage keys for direct access if needed
export { STORAGE_KEYS }
