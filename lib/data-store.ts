'use client'

import type { Subscription, Job, User, SalonProfile, Payment, Alert, Application } from './types'
import { syncSalonCreditsToSupabase } from './supabase-sync'

// Storage keys
const SUBSCRIPTIONS_KEY = 'salonjobsindia_subscriptions'
const JOBS_KEY = 'salonjobsindia_jobs'
const USERS_KEY = 'salonjobsindia_users'
const MESSAGES_KEY = 'salonjobsindia_messages'
const NOTIFICATIONS_KEY = 'salonjobsindia_notifications'
const JOB_ALERTS_KEY = 'salonjobsindia_job_alerts'
const SALON_PROFILES_KEY = 'salonjobsindia_salon_profiles'
const PAYMENTS_KEY = 'salonjobsindia_payments'
const ALERTS_KEY = 'salonjobsindia_alerts'
const APPLICATIONS_KEY = 'salonjobsindia_applications'
const JOB_SEEKERS_KEY = 'salonjobsindia_job_seekers'

// Helper to dispatch sync events
function dispatchDataUpdate(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salonjobsindia_data_updated', { detail: { key } }))
    const syncKey = 'salonjobsindia_sync_trigger'
    const timestamp = Date.now().toString()
    localStorage.setItem(syncKey, timestamp)
  }
}

// Job Seeker Plans - No longer needed as job seekers are always free
export const JOB_SEEKER_PLANS: never[] = []

// Salon Owner Plans
export interface SalonOwnerPlan {
  id: string
  name: string
  price: number
  jobPosts: number
  validityDays: number
  contactCredits: number
  features: string[]
  recommended?: boolean
  color: string
}

export const SALON_OWNER_PLANS: SalonOwnerPlan[] = [
  {
    id: 'single_post',
    name: 'Single Job Post',
    price: 499,
    jobPosts: 1,
    validityDays: 30,
    contactCredits: 30,
    features: [
      'Post 1 job for 30 days',
      'Receive unlimited applications',
      '30 candidate contact unlocks',
      'Edit job up to 3 times',
      'Delete job anytime',
      'Basic analytics'
    ],
    recommended: true,
    color: '#4A90D9',
  },
]

// ============== SHOP VIEW TRACKING ==============

export function canViewMoreShops(userId: string): { canView: boolean; remaining: number | 'unlimited'; total: number | 'unlimited' } {
  const subscription = getSubscriptionByUserId(userId)
  
  if (!subscription || subscription.status !== 'approved') {
    return { canView: false, remaining: 0, total: 0 }
  }
  
  // Check if subscription has expired
  if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
    return { canView: false, remaining: 0, total: 0 }
  }
  
  // Job seekers have unlimited access, salon owners have job posting limits
  return { canView: true, remaining: 'unlimited', total: 'unlimited' }
}

// Message interface
export interface Message {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserPhone: string
  toUserId: string
  toSalonName: string
  jobId: string
  jobRole: string
  message: string
  createdAt: Date
  isRead: boolean
}

// ============== SALON PROFILES ==============

export function getAllSalonProfiles(): SalonProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(SALON_PROFILES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getSalonProfileByOwnerId(ownerId: string): SalonProfile | null {
  const profiles = getAllSalonProfiles()
  return profiles.find(p => p.ownerId === ownerId) || null
}

export function saveSalonProfile(profile: SalonProfile): void {
  if (typeof window === 'undefined') return
  const profiles = getAllSalonProfiles()
  const existingIndex = profiles.findIndex(p => p.id === profile.id)
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile
  } else {
    profiles.push(profile)
  }
  
  localStorage.setItem(SALON_PROFILES_KEY, JSON.stringify(profiles))
  dispatchDataUpdate(SALON_PROFILES_KEY)
}

export function updateSalonCredits(ownerId: string, creditsToAdd: number): SalonProfile | null {
  const profile = getSalonProfileByOwnerId(ownerId)
  if (profile) {
    profile.contactCredits = (profile.contactCredits || 0) + creditsToAdd
    saveSalonProfile(profile)
    
    // Sync to Supabase in background (non-blocking)
    syncSalonCreditsToSupabase(profile).catch(err => {
      console.warn('[v0] Failed to sync salon credits to Supabase:', err)
    })
    
    return profile
  }
  return null
}

export function deductSalonCredit(ownerId: string, candidateId: string): boolean {
  const profile = getSalonProfileByOwnerId(ownerId)
  if (!profile) return false
  
  // Check if already unlocked
  if (profile.unlockedCandidates?.includes(candidateId)) {
    return true // Already unlocked, no deduction needed
  }
  
  // Check if has credits
  if ((profile.contactCredits || 0) <= 0) {
    return false
  }
  
  // Deduct credit and add to unlocked
  profile.contactCredits = (profile.contactCredits || 0) - 1
  profile.unlockedCandidates = [...(profile.unlockedCandidates || []), candidateId]
  saveSalonProfile(profile)
  
  // Sync to Supabase in background (non-blocking)
  syncSalonCreditsToSupabase(profile).catch(err => {
    console.warn('[v0] Failed to sync salon credits after deduction:', err)
  })
  
  // Create alert for credits low
  if (profile.contactCredits <= 5) {
    createAlert({
      userId: ownerId,
      type: 'credits_low',
      title: 'Credits Running Low',
      message: `You have only ${profile.contactCredits} contact credits remaining. Buy more to continue unlocking candidates.`,
      isRead: false,
    })
  }
  
  return true
}

export function isCandidateUnlocked(ownerId: string, candidateId: string): boolean {
  const profile = getSalonProfileByOwnerId(ownerId)
  return profile?.unlockedCandidates?.includes(candidateId) || false
}

// ============== PAYMENTS ==============

export function getAllPayments(): Payment[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(PAYMENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getPendingPayments(): Payment[] {
  return getAllPayments().filter(p => p.status === 'pending')
}

export function getPaymentsByUserId(userId: string): Payment[] {
  return getAllPayments().filter(p => p.userId === userId)
}

export function savePayment(payment: Payment): void {
  if (typeof window === 'undefined') return
  const payments = getAllPayments()
  const existingIndex = payments.findIndex(p => p.id === payment.id)
  
  if (existingIndex >= 0) {
    payments[existingIndex] = payment
  } else {
    payments.push(payment)
  }
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  dispatchDataUpdate(PAYMENTS_KEY)
}

export function approvePayment(paymentId: string, adminId: string): Payment | null {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) return null
  
  payment.status = 'approved'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  
  // Handle different payment types
  if (payment.type === 'job_publishing' && payment.jobId) {
    // Make job live
    const jobs = getAllJobs()
    const job = jobs.find(j => j.id === payment.jobId)
    if (job) {
      // Get salon profile for logo and verified status
      const salonProfile = getSalonProfileByOwnerId(payment.userId)
      
      job.status = 'live'
      job.isActive = true
      job.expiresAt = new Date(Date.now() + payment.validityDays * 24 * 60 * 60 * 1000)
      job.paymentApprovedAt = new Date()
      
      // Copy salon logo and verified status from profile (if not already set on job)
      if (salonProfile) {
        if (!job.salonLogo && salonProfile.logoUrl) {
          job.salonLogo = salonProfile.logoUrl
        }
        job.isVerified = !!(salonProfile.isVerified && salonProfile.verifiedUntil && new Date(salonProfile.verifiedUntil) > new Date())
      }
      
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
    }
    
    // Add contact credits
    updateSalonCredits(payment.userId, payment.contactCredits || 30)
    
    // Create alert
    createAlert({
      userId: payment.userId,
      type: 'job_live',
      title: 'Job is Live!',
      message: 'Your job post is now live and visible to job seekers.',
      data: { jobId: payment.jobId },
      isRead: false,
    })
  } else if (payment.type === 'verified_badge') {
    // Activate verified badge
    const profile = getSalonProfileByOwnerId(payment.userId)
    if (profile) {
      profile.isVerified = true
      profile.verifiedUntil = new Date(Date.now() + payment.validityDays * 24 * 60 * 60 * 1000)
      saveSalonProfile(profile)
      
      // Update all live jobs from this salon to show verified badge
      const jobs = getAllJobs()
      jobs.forEach(job => {
        if (job.salonId === payment.userId && job.status === 'live') {
          job.isVerified = true
        }
      })
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
    }
    
    createAlert({
      userId: payment.userId,
      type: 'verified_activated',
      title: 'Verified Badge Activated',
      message: 'Your salon is now verified. The badge will appear on your profile and job posts.',
      isRead: false,
    })
  } else if (payment.type === 'contact_pack') {
    // Add contact credits
    updateSalonCredits(payment.userId, payment.contactCredits || 0)
    
    createAlert({
      userId: payment.userId,
      type: 'contact_pack_approved',
      title: 'Contact Pack Approved',
      message: `${payment.contactCredits} contact credits have been added to your account.`,
      isRead: false,
    })
  }
  
  dispatchDataUpdate(PAYMENTS_KEY)
  return payment
}

export function rejectPayment(paymentId: string, adminId: string, reason?: string): Payment | null {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) return null
  
  payment.status = 'rejected'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  payment.rejectionReason = reason
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  
  // Update job status if job publishing
  if (payment.type === 'job_publishing' && payment.jobId) {
    const jobs = getAllJobs()
    const job = jobs.find(j => j.id === payment.jobId)
    if (job) {
      job.status = 'draft'
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
    }
  }
  
  createAlert({
    userId: payment.userId,
    type: 'payment_rejected',
    title: 'Payment Rejected',
    message: reason || 'Your payment could not be verified. Please try again or contact support.',
    isRead: false,
  })
  
  dispatchDataUpdate(PAYMENTS_KEY)
  return payment
}

// ============== ALERTS ==============

export function getAllAlerts(): Alert[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(ALERTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getAlertsByUserId(userId: string): Alert[] {
  return getAllAlerts()
    .filter(a => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getUnreadAlertCount(userId: string): number {
  return getAlertsByUserId(userId).filter(a => !a.isRead).length
}

export function createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Alert {
  const newAlert: Alert = {
    ...alert,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  }
  
  const alerts = getAllAlerts()
  alerts.unshift(newAlert)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
    dispatchDataUpdate(ALERTS_KEY)
  }
  
  return newAlert
}

export function markAlertAsRead(alertId: string): void {
  const alerts = getAllAlerts()
  const alert = alerts.find(a => a.id === alertId)
  
  if (alert) {
    alert.isRead = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
      dispatchDataUpdate(ALERTS_KEY)
    }
  }
}

export function markAllAlertsAsRead(userId: string): void {
  const alerts = getAllAlerts()
  
  alerts.forEach(a => {
    if (a.userId === userId) {
      a.isRead = true
    }
  })
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
    dispatchDataUpdate(ALERTS_KEY)
  }
}

// ============== APPLICATIONS ==============

export function getAllApplications(): Application[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(APPLICATIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getApplicationsByJobId(jobId: string): Application[] {
  return getAllApplications().filter(a => a.jobId === jobId)
}

export function getApplicationsBySalonId(salonId: string): Application[] {
  return getAllApplications()
    .filter(a => a.salonId === salonId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getApplicationsByCandidateId(candidateId: string): Application[] {
  return getAllApplications()
    .filter(a => a.candidateId === candidateId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function saveApplication(application: Application): void {
  if (typeof window === 'undefined') return
  const applications = getAllApplications()
  const existingIndex = applications.findIndex(a => a.id === application.id)
  
  if (existingIndex >= 0) {
    applications[existingIndex] = application
  } else {
    applications.push(application)
  }
  
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
  dispatchDataUpdate(APPLICATIONS_KEY)
}

export function updateApplicationStatus(applicationId: string, status: Application['status']): Application | null {
  const applications = getAllApplications()
  const application = applications.find(a => a.id === applicationId)
  
  if (application) {
    application.status = status
    application.updatedAt = new Date()
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
    dispatchDataUpdate(APPLICATIONS_KEY)
    return application
  }
  
  return null
}

// ============== JOB SEEKERS (Candidates) ==============

export interface JobSeeker {
  id: string
  userId: string
  name: string
  phone?: string
  email?: string
  photoUrl?: string
  role: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    area?: string
  }
  availabilityStatus: 'actively_looking' | 'open_to_opportunities' | 'not_looking'
  jobPreference: 'looking_for_work' | 'not_looking_for_job'
  resumeUrl?: string
  createdAt: Date
  updatedAt: Date
}

export function getAllJobSeekers(): JobSeeker[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(JOB_SEEKERS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getJobSeekerByUserId(userId: string): JobSeeker | null {
  return getAllJobSeekers().find(js => js.userId === userId) || null
}

export function saveJobSeeker(jobSeeker: JobSeeker): void {
  if (typeof window === 'undefined') return
  const jobSeekers = getAllJobSeekers()
  const existingIndex = jobSeekers.findIndex(js => js.id === jobSeeker.id)
  
  if (existingIndex >= 0) {
    jobSeekers[existingIndex] = jobSeeker
  } else {
    jobSeekers.push(jobSeeker)
  }
  
  localStorage.setItem(JOB_SEEKERS_KEY, JSON.stringify(jobSeekers))
  dispatchDataUpdate(JOB_SEEKERS_KEY)
}

export function updateJobSeekerPreference(userId: string, jobPreference: 'looking_for_work' | 'not_looking_for_job'): JobSeeker | null {
  const jobSeekers = getAllJobSeekers()
  const jobSeeker = jobSeekers.find(js => js.userId === userId)
  
  if (jobSeeker) {
    jobSeeker.jobPreference = jobPreference
    jobSeeker.updatedAt = new Date()
    localStorage.setItem(JOB_SEEKERS_KEY, JSON.stringify(jobSeekers))
    dispatchDataUpdate(JOB_SEEKERS_KEY)
    return jobSeeker
  }
  return null
}

// ============== JOB SEEKER VISIBILITY WORKFLOW ==============

// Get only VISIBLE Job Seekers (for Salon Owners to browse)
export function getVisibleJobSeekers(): JobSeeker[] {
  const jobSeekers = getAllJobSeekers()
  
  // Only return Job Seekers with 'looking_for_work' preference and 'active_visible' visibility status
  return jobSeekers.filter(js => 
    js.jobPreference === 'looking_for_work'
  ) // Note: visibility status check would require Resume data structure integration
}

// Get Job Seekers who applied to a salon's jobs (always visible to that salon)
export function getApplicantJobSeekers(salonOwnerId: string): JobSeeker[] {
  const applications = getApplicationsBySalonId(salonOwnerId)
  const applicantIds = applications.map(a => a.candidateId)
  
  return getAllJobSeekers().filter(js => applicantIds.includes(js.userId))
}

// Approve Job Seeker payment and make profile visible
export function approveJobSeekerPayment(paymentId: string, adminId: string): { success: boolean; resumeId?: string; error?: string } {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  if (payment.type !== 'job_seeker_subscription' || !payment.resumeId) {
    return { success: false, error: 'Payment is not for job seeker subscription' }
  }
  
  // Update payment
  payment.status = 'approved'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  
  // Update subscriptions (mark approved)
  const subscriptions = getAllSubscriptions()
  const subscription = subscriptions.find(s => s.userId === payment.userId && s.status === 'pending')
  
  if (subscription) {
    subscription.status = 'approved'
    subscription.approvedAt = new Date()
    subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
    dispatchDataUpdate(SUBSCRIPTIONS_KEY)
    
    console.log('[v0] Job Seeker subscription approved:', subscription.userId)
  }
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  dispatchDataUpdate(PAYMENTS_KEY)
  
  createAlert({
    userId: payment.userId,
    type: 'payment_approved',
    title: 'Profile Approved!',
    message: 'Your profile is now visible to salon owners.',
    data: { resumeId: payment.resumeId },
    isRead: false,
  })
  
  return { success: true, resumeId: payment.resumeId }
}

// Reject Job Seeker payment
export function rejectJobSeekerPayment(paymentId: string, adminId: string, reason?: string): { success: boolean; error?: string } {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  payment.status = 'rejected'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  payment.rejectionReason = reason
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  dispatchDataUpdate(PAYMENTS_KEY)
  
  createAlert({
    userId: payment.userId,
    type: 'payment_rejected',
    title: 'Profile Verification Failed',
    message: reason || 'Your profile verification failed. Please contact support.',
    isRead: false,
  })
  
  console.log('[v0] Job Seeker payment rejected:', payment.userId)
  
  return { success: true }
}

export function getJobSeekersForSalonOwners(salonOwnerId: string): JobSeeker[] {
  const jobSeekers = getAllJobSeekers()
  const applications = getApplicationsBySalonId(salonOwnerId)
  const approvedAlerts = getAllJobAlerts().filter(a => a.status === 'approved')
  const approvedUserIds = approvedAlerts.map(a => a.userId)
  
  // Return job seekers who:
  // 1. Have applied to this salon's jobs, OR
  // 2. Are "looking_for_work" AND have an approved job alert (profile approved by admin)
  const applicantIds = applications.map(a => a.candidateId)
  
  return jobSeekers.filter(js => 
    applicantIds.includes(js.userId) || 
    (js.jobPreference === 'looking_for_work' && approvedUserIds.includes(js.userId))
  )
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
  dispatchDataUpdate(SUBSCRIPTIONS_KEY)
}

export function approveSubscription(subscriptionId: string): Subscription | null {
  const subscriptions = getAllSubscriptions()
  const subscription = subscriptions.find(s => s.id === subscriptionId)
  
  if (subscription) {
    subscription.status = 'approved'
    subscription.approvedAt = new Date()
    subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
    updateUserSubscription(subscription.userId, true)
    
    createNotification({
      userId: subscription.userId,
      type: 'payment_approved',
      title: 'Subscription Activated!',
      message: `Your ${subscription.planName} plan is now active. Enjoy premium features!`,
      isRead: false,
    })
    
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
    
    createNotification({
      userId: subscription.userId,
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message: reason || 'Your payment could not be verified. Please try again or contact support.',
      isRead: false,
    })
    
    dispatchDataUpdate(SUBSCRIPTIONS_KEY)
  }
}

function updateUserSubscription(userId: string, isSubscribed: boolean): void {
  if (typeof window === 'undefined' || !userId) return
  
  try {
    const currentUserStr = localStorage.getItem('fitonze_current_user')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        if (currentUser?.id === userId) {
          currentUser.isSubscribed = isSubscribed
          localStorage.setItem('fitonze_current_user', JSON.stringify(currentUser))
        }
      } catch {
        // Ignore
      }
    }
    
    const usersStr = localStorage.getItem(USERS_KEY)
    if (usersStr) {
      try {
        const users = JSON.parse(usersStr)
        for (const email in users) {
          if (!users[email]) continue
          const userData = users[email]
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
            break
          }
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(users))
      } catch {
        // Ignore
      }
    }
    
    dispatchDataUpdate(USERS_KEY)
  } catch {
    // Silently fail
  }
}

// ============== JOBS ==============

// Fetch approved jobs from cloud and merge with local
export async function syncApprovedJobsFromCloud(): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    const response = await fetch('/api/sync?type=approved-jobs')
    const data = await response.json()
    
    if (data.success && Array.isArray(data.data)) {
      const cloudJobs = data.data as Job[]
      const localJobs = getAllJobs()
      
      // Merge cloud jobs with local, avoiding duplicates
      let hasChanges = false
      cloudJobs.forEach(cloudJob => {
        const existingIndex = localJobs.findIndex(
          j => j.id === cloudJob.id || 
               (j.salonId === cloudJob.salonId && j.paymentId === cloudJob.paymentId)
        )
        
        if (existingIndex === -1) {
          // Add new job from cloud
          localJobs.push({
            ...cloudJob,
            isActive: true,
            status: 'live',
          } as Job)
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        localStorage.setItem(JOBS_KEY, JSON.stringify(localJobs))
        dispatchDataUpdate(JOBS_KEY)
      }
    }
  } catch (error) {
    console.error('Error syncing approved jobs from cloud:', error)
  }
}

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
  return getAllJobs().find(j => j.id === jobId) || null
}

export function getJobsBySalonId(salonId: string): Job[] {
  return getAllJobs().filter(j => j.salonId === salonId)
}

export function getLiveJobBySalonId(salonId: string): Job | null {
  return getAllJobs().find(j => j.salonId === salonId && j.status === 'live') || null
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
  dispatchDataUpdate(JOBS_KEY)
}

export function deleteJob(jobId: string): void {
  if (typeof window === 'undefined') return
  const jobs = getAllJobs()
  const job = jobs.find(j => j.id === jobId)
  
  if (job) {
    job.status = 'expired'
    job.isActive = false
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
    dispatchDataUpdate(JOBS_KEY)
  }
}

export function canEditJob(jobId: string): { canEdit: boolean; editsUsed: number; maxEdits: number } {
  const job = getJobById(jobId)
  if (!job) return { canEdit: false, editsUsed: 0, maxEdits: 3 }
  
  return {
    canEdit: (job.editsUsed || 0) < (job.maxEdits || 3),
    editsUsed: job.editsUsed || 0,
    maxEdits: job.maxEdits || 3,
  }
}

export function incrementJobEdit(jobId: string): boolean {
  const job = getJobById(jobId)
  if (!job) return false
  
  const editsUsed = job.editsUsed || 0
  const maxEdits = job.maxEdits || 3
  
  if (editsUsed >= maxEdits) return false
  
  job.editsUsed = editsUsed + 1
  saveJob(job)
  return true
}

// ============== JOB PAYMENT WORKFLOW ==============

// Get jobs by status for admin dashboard
export function getJobsByStatus(status: Job['status']): Job[] {
  return getAllJobs()
    .filter(j => j.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Get only LIVE jobs visible to Job Seekers
export function getLiveJobs(): Job[] {
  return getAllJobs()
    .filter(j => j.status === 'live' && j.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Approve payment and make job live (atomic operation)
export function approveJobPayment(paymentId: string, adminId: string): { success: boolean; jobId?: string; error?: string } {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  if (payment.type !== 'job_publishing' || !payment.jobId) {
    return { success: false, error: 'Payment is not for job publishing' }
  }
  
  // Update payment
  payment.status = 'approved'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  
  // Update job
  const jobs = getAllJobs()
  const job = jobs.find(j => j.id === payment.jobId)
  
  if (!job) {
    return { success: false, error: 'Job not found' }
  }
  
  job.status = 'live'
  job.isActive = true
  job.paymentApprovedAt = new Date()
  job.expiresAt = new Date(Date.now() + (payment.validityDays || 30) * 24 * 60 * 60 * 1000)
  
  // Add contact credits
  updateSalonCredits(payment.userId, payment.contactCredits || 30)
  
  // Save updates
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  dispatchDataUpdate(PAYMENTS_KEY)
  dispatchDataUpdate(JOBS_KEY)
  
  console.log('[v0] Job payment approved, job now live:', job.id)
  
  // Create alert
  createAlert({
    userId: payment.userId,
    type: 'job_live',
    title: 'Job is Live!',
    message: `Your job "${job.role}" is now live and visible to all job seekers.`,
    data: { jobId: job.id },
    isRead: false,
  })
  
  return { success: true, jobId: job.id }
}

// Reject payment and revert job to draft
export function rejectJobPayment(paymentId: string, adminId: string, reason?: string): { success: boolean; error?: string } {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  payment.status = 'rejected'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  payment.rejectionReason = reason
  
  if (payment.jobId) {
    const jobs = getAllJobs()
    const job = jobs.find(j => j.id === payment.jobId)
    if (job) {
      job.status = 'draft'
      job.isActive = false
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
      dispatchDataUpdate(JOBS_KEY)
      
      console.log('[v0] Job payment rejected, job reverted to draft:', job.id)
    }
  }
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  dispatchDataUpdate(PAYMENTS_KEY)
  
  createAlert({
    userId: payment.userId,
    type: 'payment_rejected',
    title: 'Payment Rejected',
    message: reason || 'Your payment verification failed. Please contact support.',
    isRead: false,
  })
  
  return { success: true }
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

// ============== GET ALL USERS ==============

export function getAllUsersForAdmin(): User[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(USERS_KEY)
    if (!data) return []
    
    const usersObj = JSON.parse(data)
    return Object.values(usersObj).map((record: unknown) => (record as { user: User }).user)
  } catch {
    return []
  }
}

// ============== JOB ALERTS ==============

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
  return getAllJobAlerts().find(a => a.userId === userId) || null
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
    
    // Update the job seeker's preference to make them visible to salon owners
    const jobSeeker = getJobSeekerByUserId(alert.userId)
    if (jobSeeker) {
      jobSeeker.jobPreference = 'looking_for_work'
      jobSeeker.updatedAt = new Date()
      saveJobSeeker(jobSeeker)
    }
    
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

// ============== EXPIRY CHECKS ==============

export function checkAndExpireJobs(): void {
  const jobs = getAllJobs()
  const now = new Date()
  let updated = false
  
  jobs.forEach(job => {
    if (job.status === 'live' && job.expiresAt && new Date(job.expiresAt) < now) {
      job.status = 'expired'
      job.isActive = false
      updated = true
      
      createAlert({
        userId: job.salonId,
        type: 'job_expired',
        title: 'Job Post Expired',
        message: 'Your job post has expired. Subscribe again to make it live.',
        data: { jobId: job.id },
        isRead: false,
      })
    }
  })
  
  if (updated && typeof window !== 'undefined') {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
    dispatchDataUpdate(JOBS_KEY)
  }
}

export function checkAndExpireVerifiedBadges(): void {
  const profiles = getAllSalonProfiles()
  const now = new Date()
  let updated = false
  
  profiles.forEach(profile => {
    if (profile.isVerified && profile.verifiedUntil && new Date(profile.verifiedUntil) < now) {
      profile.isVerified = false
      profile.verifiedUntil = undefined
      updated = true
      
      createAlert({
        userId: profile.ownerId,
        type: 'verified_expired',
        title: 'Verified Badge Expired',
        message: 'Your Verified Salon badge has expired. Renew to maintain trust with job seekers.',
        isRead: false,
      })
    }
  })
  
  if (updated && typeof window !== 'undefined') {
    localStorage.setItem(SALON_PROFILES_KEY, JSON.stringify(profiles))
    dispatchDataUpdate(SALON_PROFILES_KEY)
  }
}

// ============== CREDITS SYSTEM ==============

// Get contact credit balance for a salon owner
export function getCreditBalance(salonOwnerId: string): number {
  const profile = getSalonProfileByOwnerId(salonOwnerId)
  return profile?.contactCredits || 0
}

// Deduct credit with validation
export function deductContactCredit(salonOwnerId: string, candidateId: string): { success: boolean; creditsRemaining?: number; error?: string } {
  const profile = getSalonProfileByOwnerId(salonOwnerId)
  
  if (!profile) {
    return { success: false, error: 'Salon profile not found' }
  }
  
  // Check if already unlocked
  if (profile.unlockedCandidates?.includes(candidateId)) {
    console.log('[v0] Candidate already unlocked, no deduction needed')
    return { success: true, creditsRemaining: profile.contactCredits }
  }
  
  // Check if has credits
  if ((profile.contactCredits || 0) <= 0) {
    return { success: false, error: 'Insufficient contact credits', creditsRemaining: 0 }
  }
  
  // Deduct credit and add to unlocked
  profile.contactCredits = (profile.contactCredits || 0) - 1
  profile.unlockedCandidates = [...(profile.unlockedCandidates || []), candidateId]
  saveSalonProfile(profile)
  
  console.log('[v0] Credit deducted. Remaining:', profile.contactCredits)
  
  // Create alert for credits low
  if (profile.contactCredits <= 5) {
    createAlert({
      userId: salonOwnerId,
      type: 'credits_low',
      title: 'Credits Running Low',
      message: `You have only ${profile.contactCredits} contact credits remaining. Buy more to continue unlocking candidates.`,
      isRead: false,
    })
  }
  
  return { success: true, creditsRemaining: profile.contactCredits }
}

// Buy credit pack with payment
export function buyCreditPack(salonOwnerId: string, packId: string): { success: boolean; paymentId?: string; error?: string } {
  const CREDIT_PACKS: Record<string, { credits: number; price: number }> = {
    'credit_pack_15': { credits: 15, price: 199 },
    'credit_pack_50': { credits: 50, price: 499 }
  }
  
  const pack = CREDIT_PACKS[packId]
  if (!pack) {
    return { success: false, error: 'Credit pack not found' }
  }
  
  const profile = getSalonProfileByOwnerId(salonOwnerId)
  if (!profile) {
    return { success: false, error: 'Salon profile not found' }
  }
  
  // Create payment record
  const transactionId = `credit_${salonOwnerId}_${Date.now()}`
  const payment: Payment = {
    id: crypto.randomUUID(),
    userId: salonOwnerId,
    userName: profile.ownerName,
    userPhone: profile.mobile,
    salonName: profile.salonName,
    type: 'contact_pack',
    planId: packId,
    amount: pack.price,
    status: 'pending',
    contactCredits: pack.credits,
    validityDays: 365, // Credits don't expire
    transactionId,
    submittedAt: new Date()
  }
  
  savePayment(payment)
  
  console.log('[v0] Credit pack purchase created, awaiting admin approval:', payment.id)
  
  createAlert({
    userId: salonOwnerId,
    type: 'payment_pending',
    title: 'Credit Pack Purchase Submitted',
    message: `You've submitted a purchase for ${pack.credits} contact credits. Awaiting admin verification.`,
    data: { paymentId: payment.id },
    isRead: false,
  })
  
  return { success: true, paymentId: payment.id }
}

// Approve credit purchase payment
export function approveCreditPurchasePayment(paymentId: string, adminId: string): { success: boolean; creditsAdded?: number; error?: string } {
  const payments = getAllPayments()
  const payment = payments.find(p => p.id === paymentId)
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  if (payment.type !== 'contact_pack') {
    return { success: false, error: 'Payment is not for credit pack' }
  }
  
  // Check for duplicate
  if (payment.transactionId) {
    const existing = payments.filter(p => 
      p.transactionId === payment.transactionId && 
      p.status === 'approved' && 
      p.id !== payment.id
    )
    if (existing.length > 0) {
      console.log('[v0] Duplicate payment detected, rejecting')
      return { success: false, error: 'Duplicate payment detected' }
    }
  }
  
  // Update payment
  payment.status = 'approved'
  payment.processedAt = new Date()
  payment.processedBy = adminId
  
  // Add credits to profile
  const creditsAdded = payment.contactCredits || 0
  const profile = updateSalonCredits(payment.userId, creditsAdded)
  
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  dispatchDataUpdate(PAYMENTS_KEY)
  
  console.log('[v0] Credit purchase approved, credits added:', creditsAdded)
  
  createAlert({
    userId: payment.userId,
    type: 'contact_pack_approved',
    title: 'Credits Added to Your Account',
    message: `${creditsAdded} contact credits have been successfully added.`,
    isRead: false,
  })
  
  return { success: true, creditsAdded }
}

// Location Management
const LOCATIONS_KEY = 'salonjobsindia_locations'

export interface LocationRecord {
  userId: string
  latitude: number
  longitude: number
  address: string
  city: string
  district: string
  state: string
  country: string
  postalCode?: string
  formattedAddress?: string
  timestamp: Date
}

export function saveLocation(location: Omit<LocationRecord, 'timestamp'> & { timestamp?: Date }): LocationRecord {
  if (typeof window === 'undefined') return { ...location, timestamp: new Date() } as LocationRecord
  
  try {
    const locations: LocationRecord[] = JSON.parse(localStorage.getItem(LOCATIONS_KEY) || '[]')
    
    const locationRecord: LocationRecord = {
      ...location,
      timestamp: location.timestamp || new Date(),
    }
    
    // Remove duplicate user locations and add the new one
    const filtered = locations.filter(l => l.userId !== location.userId)
    filtered.push(locationRecord)
    
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(filtered))
    dispatchDataUpdate(LOCATIONS_KEY)
    
    console.log('[v0] Location saved for user:', location.userId)
    return locationRecord
  } catch (error) {
    console.error('[v0] Failed to save location:', error)
    return { ...location, timestamp: new Date() } as LocationRecord
  }
}

export function getLocationsByCity(city: string): LocationRecord[] {
  if (typeof window === 'undefined') return []
  
  try {
    const locations: LocationRecord[] = JSON.parse(localStorage.getItem(LOCATIONS_KEY) || '[]')
    return locations.filter(l => l.city.toLowerCase() === city.toLowerCase())
  } catch (error) {
    console.error('[v0] Failed to retrieve locations by city:', error)
    return []
  }
}

export function getUserLocation(userId: string): LocationRecord | null {
  if (typeof window === 'undefined') return null
  
  try {
    const locations: LocationRecord[] = JSON.parse(localStorage.getItem(LOCATIONS_KEY) || '[]')
    return locations.find(l => l.userId === userId) || null
  } catch (error) {
    console.error('[v0] Failed to retrieve user location:', error)
    return null
  }
}

export function getAllLocations(): LocationRecord[] {
  if (typeof window === 'undefined') return []
  
  try {
    return JSON.parse(localStorage.getItem(LOCATIONS_KEY) || '[]')
  } catch (error) {
    console.error('[v0] Failed to retrieve all locations:', error)
    return []
  }
}


