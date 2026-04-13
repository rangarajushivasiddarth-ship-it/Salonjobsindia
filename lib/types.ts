// User Types
export type UserRole = 'job_seeker' | 'salon_owner'

export interface User {
  id: string
  email: string
  phone: string
  name?: string
  role: UserRole
  isSubscribed: boolean
  subscriptionExpiry?: Date
  createdAt: Date
}

// Resume Types
export interface Resume {
  id: string
  userId: string
  name: string
  role: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: {
    lat: number
    lng: number
    address: string
  }
  createdAt: Date
  updatedAt: Date
}

// Job Types
export interface Job {
  id: string
  salonId: string
  salonName: string
  role: string
  salary: string
  experience: string
  location: {
    lat: number
    lng: number
    address: string
    area: string
  }
  contact?: string
  description?: string
  createdAt: Date
  isActive: boolean
}

// Salon Types
export interface Salon {
  id: string
  ownerId: string
  name: string
  location: {
    lat: number
    lng: number
    address: string
    area: string
  }
  contact: string
  jobs: Job[]
}

// Subscription Plan Types
export type JobSeekerPlanType = 'basic' | 'standard' | 'unlimited'

export interface JobSeekerPlan {
  id: JobSeekerPlanType
  name: string
  shopLimit: number | 'unlimited'
  price: number
  description: string
}

// Subscription Types
export interface Subscription {
  id: string
  userId: string
  userPhone?: string
  userName?: string
  screenshotUrl: string
  status: 'pending' | 'approved' | 'rejected'
  planType?: JobSeekerPlanType
  shopLimit?: number | 'unlimited'
  shopsViewed?: number
  createdAt: Date
  approvedAt?: Date
  expiresAt?: Date
}

// Application Types
export interface Application {
  id: string
  jobId: string
  userId: string
  resumeId: string
  status: 'pending' | 'viewed' | 'contacted'
  createdAt: Date
}

// Admin Types
export interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  totalJobs: number
  pendingApprovals: number
}

// Settings Types
export interface AppSettings {
  qrCodeUrl: string
  radiusKm: number
  paymentInstructions: string
  subscriptionDurationDays: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
