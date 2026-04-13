'use client'

import useSWR from 'swr'
import { subscriptionsApi, applicationsApi } from '@/lib/api'
import type { Subscription, Application } from '@/lib/types'

// =============================================================================
// REAL-TIME SUBSCRIPTION HOOK
// =============================================================================
// This hook connects to the backend API and provides real-time subscription data.
// When admin approves a payment, the user will see the update automatically.
// =============================================================================

interface UseRealtimeSubscriptionReturn {
  subscription: Subscription | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
  isActive: boolean
  daysRemaining: number
}

const subscriptionFetcher = async () => {
  const response = await subscriptionsApi.getMySubscription()
  
  if (!response.success) {
    // No subscription is not an error
    if (response.error?.includes('No subscription found')) {
      return null
    }
    throw new Error(response.error || 'Failed to fetch subscription')
  }
  
  return response.data
}

export function useRealtimeSubscription(): UseRealtimeSubscriptionReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'my-subscription',
    subscriptionFetcher,
    {
      refreshInterval: 5000, // Check every 5 seconds for approval updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  )

  const isActive = data?.status === 'approved' && 
    data?.expiresAt && 
    new Date(data.expiresAt) > new Date()

  const daysRemaining = data?.expiresAt 
    ? Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return {
    subscription: data || null,
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    isActive,
    daysRemaining,
  }
}

// =============================================================================
// SUBSCRIPTION PLANS HOOK
// =============================================================================

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration: number // in days
  features: string[]
  recommended?: boolean
}

export function useSubscriptionPlans() {
  const { data, error, isLoading } = useSWR(
    'subscription-plans',
    async () => {
      const response = await subscriptionsApi.getPlans()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch plans')
      }
      return response.data
    },
    {
      refreshInterval: 60000, // Plans don't change often
      revalidateOnFocus: false,
    }
  )

  return {
    plans: (data?.plans || []) as SubscriptionPlan[],
    isLoading,
    isError: !!error,
  }
}

// =============================================================================
// SUBMIT PAYMENT HOOK
// =============================================================================

export function useSubmitPayment() {
  const { mutate: mutateSubscription } = useRealtimeSubscription()

  const submitPayment = async (planId: string, screenshotFile: File): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await subscriptionsApi.submitPayment(planId, screenshotFile)
      
      if (response.success) {
        // Refresh subscription data
        mutateSubscription()
        return { success: true }
      }
      
      return { success: false, error: response.error || 'Failed to submit payment' }
    } catch (error) {
      console.error('Payment submission error:', error)
      return { success: false, error: 'Failed to submit payment' }
    }
  }

  return { submitPayment }
}

// =============================================================================
// REAL-TIME APPLICATIONS HOOK (For Job Seekers)
// =============================================================================

interface UseRealtimeApplicationsReturn {
  applications: Application[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
  applyToJob: (jobId: string, coverLetter?: string) => Promise<{ success: boolean; error?: string }>
  withdrawApplication: (applicationId: string) => Promise<{ success: boolean; error?: string }>
}

export function useRealtimeApplications(): UseRealtimeApplicationsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'my-applications',
    async () => {
      const response = await applicationsApi.getMyApplications()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch applications')
      }
      return response.data
    },
    {
      refreshInterval: 10000, // Check every 10 seconds for status updates
      revalidateOnFocus: true,
    }
  )

  const applyToJob = async (jobId: string, coverLetter?: string) => {
    try {
      const response = await applicationsApi.apply(jobId, coverLetter)
      if (response.success) {
        mutate()
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to apply:', error)
      return { success: false, error: 'Failed to apply to job' }
    }
  }

  const withdrawApplication = async (applicationId: string) => {
    try {
      const response = await applicationsApi.withdraw(applicationId)
      if (response.success) {
        mutate()
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to withdraw:', error)
      return { success: false, error: 'Failed to withdraw application' }
    }
  }

  return {
    applications: data?.applications || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    applyToJob,
    withdrawApplication,
  }
}

// =============================================================================
// OWNER APPLICATIONS HOOK (For Salon Owners to see applications to their jobs)
// =============================================================================

interface UseOwnerApplicationsReturn {
  applications: Application[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
  updateStatus: (applicationId: string, status: 'shortlisted' | 'rejected' | 'hired') => Promise<{ success: boolean; error?: string }>
}

export function useOwnerApplications(jobId?: string): UseOwnerApplicationsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    jobId ? `owner-applications::${jobId}` : 'owner-all-applications',
    async () => {
      const response = jobId 
        ? await applicationsApi.getJobApplications(jobId)
        : await applicationsApi.getOwnerApplications()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch applications')
      }
      return response.data
    },
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  )

  const updateStatus = async (applicationId: string, status: 'shortlisted' | 'rejected' | 'hired') => {
    try {
      const response = await applicationsApi.updateStatus(applicationId, status)
      if (response.success) {
        mutate()
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to update status:', error)
      return { success: false, error: 'Failed to update application status' }
    }
  }

  return {
    applications: data?.applications || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    updateStatus,
  }
}

// =============================================================================
// ADMIN SUBSCRIPTIONS HOOK (For Admin to manage pending payments)
// =============================================================================

export function useAdminPendingSubscriptions() {
  const { data, error, isLoading, mutate } = useSWR(
    'admin-pending-subscriptions',
    async () => {
      const response = await subscriptionsApi.getPendingSubscriptions()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pending subscriptions')
      }
      return response.data
    },
    {
      refreshInterval: 5000, // Check frequently for new payments
      revalidateOnFocus: true,
    }
  )

  const approveSubscription = async (subscriptionId: string) => {
    try {
      const response = await subscriptionsApi.approveSubscription(subscriptionId)
      if (response.success) {
        mutate()
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to approve:', error)
      return { success: false, error: 'Failed to approve subscription' }
    }
  }

  const rejectSubscription = async (subscriptionId: string, reason?: string) => {
    try {
      const response = await subscriptionsApi.rejectSubscription(subscriptionId, reason)
      if (response.success) {
        mutate()
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to reject:', error)
      return { success: false, error: 'Failed to reject subscription' }
    }
  }

  return {
    pendingSubscriptions: data?.subscriptions || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    approveSubscription,
    rejectSubscription,
  }
}
