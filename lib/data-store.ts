'use client'

import type { Subscription, Job, User, JobSeekerPlan } from './types'

// Storage keys - unified with data-service for consistency
const SUBSCRIPTIONS_KEY = 'salonjobsindia_subscriptions'
const JOBS_KEY = 'salonjobsindia_jobs'
const USERS_KEY = 'salonjobsindia_users'
const MESSAGES_KEY = 'salonjobsindia_messages'
const NOTIFICATIONS_KEY = 'salonjobsindia_notifications'
const JOB_ALERTS_KEY = 'salonjobsindia_job_alerts'

// Helper to dispatch sync events and trigger cross-tab communication
function dispatchDataUpdate(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salonjobsindia_data_updated', { detail: { key } }))
    
    // Force trigger storage event for cross-tab sync by writing a sync timestamp
    // This ensures other tabs (like admin) get notified immediately
    const syncKey = 'salonjobsindia_sync_trigger'
    const timestamp = Date.now().toString()
    localStorage.setItem(syncKey, timestamp)
  }
}

// Job Seeker Plans - Gold, Premium, Ultra Premium
export const JOB_SEEKER_PLANS: JobSeekerPlan[] = [
  {
    id: 'gold',
    name: 'Gold',
    shopLimit: 10,
    price: 99,
    features: [
      'View up to 10 salon profiles',
      'Apply to jobs',
      'Basic chat support',
      'Email notifications'
    ],
    color: '#FFD700',
  },
  {
    id: 'premium',
    name: 'Premium',
    shopLimit: 15,
    price: 199,
    features: [
      'View up to 15 salon profiles',
      'Priority applications',
      'Full chat access',
      'Push notifications',
      'Profile boost'
    ],
    recommended: true,
    color: '#C0C0C0',
  },
  {
    id: 'ultra_premium',
    name: 'Ultra Premium',
    shopLimit: 'unlimited',
    price: 349,
    features: [
      'View unlimited salon profiles',
      'Top priority applications',
      'Direct call access to owners',
      'Verified badge',
      'Featured profile',
      'Dedicated support'
    ],
    color: '#B76E79',
  },
]

// Salon Owner Plans - Per Job Post
export const SALON_OWNER_PLANS = [
  {
    id: 'single_post',
    name: 'Single Post',
    price: 99,
    jobPosts: 1,
    validityDays: 30,
    features: [
      '1 Job posting',
      'Valid for 30 days',
      'View applicant profiles',
      'In-app chat'
    ],
  },
  {
    id: 'triple_post',
    name: 'Triple Post',
    price: 249,
    jobPosts: 3,
    validityDays: 45,
    features: [
      '3 Job postings',
      'Valid for 45 days',
      'Priority listing',
      'Applicant filters',
      'Chat + Call access'
    ],
    recommended: true,
  },
  {
    id: 'bulk_post',
    name: 'Bulk Post',
    price: 499,
    jobPosts: 10,
    validityDays: 90,
    features: [
      '10 Job postings',
      'Valid for 90 days',
      'Featured listings',
      'Advanced analytics',
      'Priority support',
      'Bulk hiring tools'
    ],
  },
]

// Message interface
export interface Message {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserPhone: string
  toUserId: string // Salon owner ID
  toSalonName: string
  jobId: string
  jobRole: string
  message: string
  createdAt: Date
  isRead: boolean
}

// ============== SUBSCRIPTIONS ==============

export function getAllSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(SUBSCRIPTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getPendingSubscriptions(): Subscription[] {
  return getAllSubscriptions().filter(s => s.status === 'pending')
}

export function getSubscriptionByUserId(userId: string): Subscription | null {
  const subscriptions = getAllSubscriptions()
  // Get the most recent subscription for this user
  const userSubs = subscriptions
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return userSubs[0] || null
}

export function saveSubscription(subscription: Subscription): void {
  if (typeof window === 'undefined') return
  const subscriptions = getAllSubscriptions()
  const existingIndex = subscriptions.findIndex(s => s.id === subscription.id)
  
  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subscription
  } else {
    subscriptions.push(subscription)
  }
  
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
  
  // Dispatch event for real-time updates (triggers cross-tab sync)
  dispatchDataUpdate(SUBSCRIPTIONS_KEY)
}

export function approveSubscription(subscriptionId: string): Subscription | null {
  const subscriptions = getAllSubscriptions()
  const subscription = subscriptions.find(s => s.id === subscriptionId)
  
  if (subscription) {
    subscription.status = 'approved'
    subscription.approvedAt = new Date()
    subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    subscription.shopsViewed = 0
    
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
    
    // Update user subscription status
    updateUserSubscription(subscription.userId, true)
    
    // Create notification for user
    createNotification({
      userId: subscription.userId,
      type: 'payment_approved',
      title: 'Subscription Activated!',
      message: `Your ${subscription.planName} plan is now active. Enjoy premium features!`,
      isRead: false,
    })
    
    // Dispatch event for real-time updates (triggers cross-tab sync)
    dispatchDataUpdate(SUBSCRIPTIONS_KEY)
    
    return subscription
  }
  return null
}

export function rejectSubscription(subscriptionId: string, reason?: string): void {
  const subscriptions = getAllSubscriptions()
  const subscription = subscriptions.find(s => s.id === subscriptionId)
  
  if (subscription) {
    subscription.status = 'rejected'
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
    
    // Create notification for user
    createNotification({
      userId: subscription.userId,
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message: reason || 'Your payment could not be verified. Please try again or contact support.',
      isRead: false,
    })
    
    // Dispatch event for real-time updates
    dispatchDataUpdate(SUBSCRIPTIONS_KEY)
  }
}

export function incrementShopsViewed(userId: string): boolean {
  const subscription = getSubscriptionByUserId(userId)
  if (!subscription || subscription.status !== 'approved') return false
  
  // Check if unlimited
  if (subscription.shopLimit === 'unlimited') return true
  
  const currentViewed = subscription.shopsViewed || 0
  const limit = typeof subscription.shopLimit === 'number' ? subscription.shopLimit : 0
  
  if (currentViewed >= limit) return false
  
  subscription.shopsViewed = currentViewed + 1
  saveSubscription(subscription)
  return true
}

export function canViewMoreShops(userId: string): { canView: boolean; remaining: number | 'unlimited'; total: number | 'unlimited' } {
  const subscription = getSubscriptionByUserId(userId)
  
  if (!subscription || subscription.status !== 'approved') {
    return { canView: false, remaining: 0, total: 0 }
  }
  
  if (subscription.shopLimit === 'unlimited') {
    return { canView: true, remaining: 'unlimited', total: 'unlimited' }
  }
  
  const limit = typeof subscription.shopLimit === 'number' ? subscription.shopLimit : 0
  const viewed = subscription.shopsViewed || 0
  const remaining = Math.max(0, limit - viewed)
  
  return { canView: remaining > 0, remaining, total: limit }
}

// ============== USER SUBSCRIPTION STATUS ==============

function updateUserSubscription(userId: string, isSubscribed: boolean): void {
  if (typeof window === 'undefined' || !userId) return
  
  try {
    // Update current user in localStorage first (most reliable)
    const currentUserStr = localStorage.getItem('fitone_current_user')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        if (currentUser?.id === userId) {
          currentUser.isSubscribed = isSubscribed
          localStorage.setItem('fitone_current_user', JSON.stringify(currentUser))
        }
      } catch {
        // Ignore parse errors for current user
      }
    }
    
    // Also try to update in users store
    const usersStr = localStorage.getItem(USERS_KEY)
    if (usersStr) {
      try {
        const users = JSON.parse(usersStr)
        let updated = false
        
        for (const email in users) {
          if (!users[email]) continue
          
          const userData = users[email]
          // Support multiple data structures
          let uid: string | undefined
          
          if (typeof userData === 'object') {
            if (userData.user && typeof userData.user === 'object') {
              uid = userData.user.id
            } else if (userData.id) {
              uid = userData.id
            }
          }
          
          if (uid === userId) {
            if (userData.user && typeof userData.user === 'object') {
              userData.user.isSubscribed = isSubscribed
            } else {
              userData.isSubscribed = isSubscribed
            }
            updated = true
            break
          }
        }
        
        if (updated) {
          localStorage.setItem(USERS_KEY, JSON.stringify(users))
        }
      } catch {
        // Ignore parse errors for users store
      }
    }
    
    // Trigger cross-tab sync
    dispatchDataUpdate(USERS_KEY)
  } catch (error) {
    // Silently fail - subscription status update is not critical
  }
}

// ============== JOBS ==============

export function getAllJobs(): Job[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(JOBS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getJobById(jobId: string): Job | null {
  const jobs = getAllJobs()
  return jobs.find(j => j.id === jobId) || null
}

export function getJobsBySalonId(salonId: string): Job[] {
  return getAllJobs().filter(j => j.salonId === salonId)
}

export function saveJob(job: Job): void {
  if (typeof window === 'undefined') return
  const jobs = getAllJobs()
  const existingIndex = jobs.findIndex(j => j.id === job.id)
  
  if (existingIndex >= 0) {
    jobs[existingIndex] = job
  } else {
    jobs.push(job)
  }
  
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  
  // Dispatch event for real-time updates
  dispatchDataUpdate(JOBS_KEY)
}

export function deleteJob(jobId: string): void {
  if (typeof window === 'undefined') return
  const jobs = getAllJobs().filter(j => j.id !== jobId)
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  
  // Dispatch event for real-time updates
  dispatchDataUpdate(JOBS_KEY)
}

// ============== MESSAGES ==============

export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(MESSAGES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getMessagesForOwner(ownerId: string): Message[] {
  return getAllMessages()
    .filter(m => m.toUserId === ownerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getUnreadMessageCount(ownerId: string): number {
  return getMessagesForOwner(ownerId).filter(m => !m.isRead).length
}

export function sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Message {
  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    isRead: false,
  }
  
  const messages = getAllMessages()
  messages.push(newMessage)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
    
    // Dispatch event for real-time updates
    dispatchDataUpdate(MESSAGES_KEY)
  }
  
  return newMessage
}

export function markMessageAsRead(messageId: string): void {
  const messages = getAllMessages()
  const message = messages.find(m => m.id === messageId)
  
  if (message) {
    message.isRead = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
    }
  }
}

// ============== REAL-TIME UPDATES HOOK ==============

export function useDataUpdates(callback: (detail: { type: string; action?: string }) => void) {
  if (typeof window === 'undefined') return
  
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }
  
  window.addEventListener('fitonze_data_update', handler)
  
  return () => {
    window.removeEventListener('fitonze_data_update', handler)
  }
}

// ============== NOTIFICATIONS ==============

interface Notification {
  id?: string
  userId: string
  type: 'job' | 'message' | 'subscription' | 'payment_approved' | 'payment_rejected' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt?: string
}

export function getAllNotifications(): Notification[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getNotificationsForUser(userId: string): Notification[] {
  return getAllNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
}

export function getUnreadNotificationCount(userId: string): number {
  return getNotificationsForUser(userId).filter(n => !n.isRead).length
}

export function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  
  const notifications = getAllNotifications()
  notifications.unshift(newNotification)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
    dispatchDataUpdate(NOTIFICATIONS_KEY)
  }
  
  return newNotification
}

export function markNotificationAsRead(notificationId: string): void {
  const notifications = getAllNotifications()
  const notification = notifications.find(n => n.id === notificationId)
  
  if (notification) {
    notification.isRead = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
      dispatchDataUpdate(NOTIFICATIONS_KEY)
    }
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  const notifications = getAllNotifications()
  
  notifications.forEach(n => {
    if (n.userId === userId) {
      n.isRead = true
    }
  })
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
    dispatchDataUpdate(NOTIFICATIONS_KEY)
  }
}

// ============== GET ALL USERS (for admin) ==============

export function getAllUsersForAdmin(): User[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(USERS_KEY)
    if (!data) return []
    
    const usersObj = JSON.parse(data)
    return Object.values(usersObj).map((record: any) => record.user)
  } catch {
    return []
  }
}

// ============== JOB ALERTS (Job Seeker Resume/Profile Submissions) ==============

export interface JobAlert {
  id: string
  userId: string
  userName: string
  userPhone: string
  userEmail?: string
  role: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: {
    lat: number
    lng: number
    address: string
  }
  passportPhotoUrl?: string
  identityProofUrl?: string
  identityProofType?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  processedAt?: Date
  processedBy?: string
  rejectionReason?: string
}

export function getAllJobAlerts(): JobAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(JOB_ALERTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getPendingJobAlerts(): JobAlert[] {
  return getAllJobAlerts().filter(alert => alert.status === 'pending')
}

export function getJobAlertByUserId(userId: string): JobAlert | null {
  const alerts = getAllJobAlerts()
  return alerts.find(a => a.userId === userId) || null
}

export function saveJobAlert(alert: JobAlert): void {
  if (typeof window === 'undefined') return
  
  const alerts = getAllJobAlerts()
  const existingIndex = alerts.findIndex(a => a.id === alert.id)
  
  if (existingIndex >= 0) {
    alerts[existingIndex] = alert
  } else {
    alerts.push(alert)
  }
  
  localStorage.setItem(JOB_ALERTS_KEY, JSON.stringify(alerts))
  dispatchDataUpdate(JOB_ALERTS_KEY)
}

export function approveJobAlert(alertId: string, adminId: string): JobAlert | null {
  const alerts = getAllJobAlerts()
  const alert = alerts.find(a => a.id === alertId)
  
  if (alert) {
    alert.status = 'approved'
    alert.processedAt = new Date()
    alert.processedBy = adminId
    
    localStorage.setItem(JOB_ALERTS_KEY, JSON.stringify(alerts))
    
    // Create notification for the user
    createNotification({
      userId: alert.userId,
      type: 'system',
      title: 'Profile Approved!',
      message: 'Your job seeker profile has been approved. You can now be matched with salons!',
      isRead: false,
    })
    
    dispatchDataUpdate(JOB_ALERTS_KEY)
    return alert
  }
  
  return null
}

export function rejectJobAlert(alertId: string, adminId: string, reason?: string): JobAlert | null {
  const alerts = getAllJobAlerts()
  const alert = alerts.find(a => a.id === alertId)
  
  if (alert) {
    alert.status = 'rejected'
    alert.processedAt = new Date()
    alert.processedBy = adminId
    alert.rejectionReason = reason
    
    localStorage.setItem(JOB_ALERTS_KEY, JSON.stringify(alerts))
    
    // Create notification for the user
    createNotification({
      userId: alert.userId,
      type: 'system',
      title: 'Profile Needs Updates',
      message: reason || 'Your job seeker profile was not approved. Please update and resubmit.',
      isRead: false,
    })
    
    dispatchDataUpdate(JOB_ALERTS_KEY)
    return alert
  }
  
  return null
}
