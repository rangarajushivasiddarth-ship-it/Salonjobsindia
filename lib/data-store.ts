'use client'

import type { Subscription, Job, User, JobSeekerPlan } from './types'

// Storage keys
const SUBSCRIPTIONS_KEY = 'fitonze_subscriptions'
const JOBS_KEY = 'fitonze_jobs'
const USERS_KEY = 'fitonze_registered_users'
const MESSAGES_KEY = 'fitonze_messages'

// Job Seeker Plans
export const JOB_SEEKER_PLANS: JobSeekerPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    shopLimit: 10,
    price: 99,
    description: 'View up to 10 salon details',
  },
  {
    id: 'standard',
    name: 'Standard',
    shopLimit: 15,
    price: 149,
    description: 'View up to 15 salon details',
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    shopLimit: 'unlimited',
    price: 399,
    description: 'View all salon details',
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
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('fitonze_data_update', { detail: { type: 'subscription' } }))
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
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('fitonze_data_update', { detail: { type: 'subscription', action: 'approved' } }))
    
    return subscription
  }
  return null
}

export function rejectSubscription(subscriptionId: string): void {
  const subscriptions = getAllSubscriptions()
  const index = subscriptions.findIndex(s => s.id === subscriptionId)
  
  if (index >= 0) {
    subscriptions[index].status = 'rejected'
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('fitonze_data_update', { detail: { type: 'subscription', action: 'rejected' } }))
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
  if (typeof window === 'undefined') return
  
  try {
    const usersStr = localStorage.getItem(USERS_KEY)
    if (!usersStr) return
    
    const users = JSON.parse(usersStr)
    
    // Find user by ID
    for (const email in users) {
      if (users[email].user.id === userId) {
        users[email].user.isSubscribed = isSubscribed
        localStorage.setItem(USERS_KEY, JSON.stringify(users))
        
        // Also update USER_KEY if this is the current user
        const currentUserStr = localStorage.getItem('fitonze_user')
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr)
          if (currentUser.id === userId) {
            currentUser.isSubscribed = isSubscribed
            localStorage.setItem('fitonze_user', JSON.stringify(currentUser))
          }
        }
        break
      }
    }
  } catch (error) {
    console.error('Failed to update user subscription:', error)
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
  window.dispatchEvent(new CustomEvent('fitonze_data_update', { detail: { type: 'job' } }))
}

export function deleteJob(jobId: string): void {
  if (typeof window === 'undefined') return
  const jobs = getAllJobs().filter(j => j.id !== jobId)
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('fitonze_data_update', { detail: { type: 'job', action: 'deleted' } }))
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
    window.dispatchEvent(new CustomEvent('fitonze_data_update', { detail: { type: 'message' } }))
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
