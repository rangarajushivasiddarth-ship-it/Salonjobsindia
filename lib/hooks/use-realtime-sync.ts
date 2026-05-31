'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PendingSubscription {
  id: string
  oderId?: string
  orderId?: string
  userId: string
  userName: string
  userPhone: string
  userEmail?: string
  userRole: string
  planId: string
  planName: string
  planPrice: number
  planDuration: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface PendingJobPayment {
  id: string
  oderId?: string
  orderId?: string
  salonId: string
  salonName: string
  ownerName: string
  ownerPhone: string
  ownerEmail?: string
  jobTitle: string
  jobDetails: Record<string, unknown>
  planId: string
  planName: string
  planPrice: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface PendingJobAlert {
  id: string
  userId: string
  userName: string
  userPhone: string
  role: string
  experience: string
  skills: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface SyncState {
  pendingSubscriptions: PendingSubscription[]
  pendingJobPayments: PendingJobPayment[]
  pendingJobAlerts: PendingJobAlert[]
  totalPending: number
  lastSync: number
  isLoading: boolean
  error: string | null
}

// Hook for admin to poll all pending items
export function useAdminSync(pollInterval = 3000) {
  const [state, setState] = useState<SyncState>({
    pendingSubscriptions: [],
    pendingJobPayments: [],
    pendingJobAlerts: [],
    totalPending: 0,
    lastSync: 0,
    isLoading: true,
    error: null,
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const fetchPending = useCallback(async () => {
    try {
      const response = await fetch('/api/sync?type=all-pending', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending items')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          pendingSubscriptions: data.pendingSubscriptions || [],
          pendingJobPayments: data.pendingJobPayments || [],
          pendingJobAlerts: data.pendingJobAlerts || [],
          totalPending: data.totalPending || 0,
          lastSync: data.timestamp || Date.now(),
          isLoading: false,
          error: null,
        }))
      }
    } catch (error) {
      console.error('[Realtime Sync] Admin fetch error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])
  
  const approveSubscription = useCallback(async (id: string, adminId: string = 'admin') => {
    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          id,
          action: 'approve',
          adminId,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Immediately refresh
        await fetchPending()
        return { success: true }
      }
      
      return { success: false, error: data.error }
    } catch (error) {
      console.error('[Realtime Sync] Approve error:', error)
      return { success: false, error: 'Failed to approve' }
    }
  }, [fetchPending])
  
  const rejectSubscription = useCallback(async (id: string, adminId: string = 'admin', reason?: string) => {
    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          id,
          action: 'reject',
          adminId,
          reason,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchPending()
        return { success: true }
      }
      
      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: 'Failed to reject' }
    }
  }, [fetchPending])
  
  const approveJobPayment = useCallback(async (id: string, adminId: string = 'admin') => {
    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'job-payment',
          id,
          action: 'approve',
          adminId,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchPending()
        return { success: true }
      }
      
      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: 'Failed to approve' }
    }
  }, [fetchPending])
  
  const rejectJobPayment = useCallback(async (id: string, adminId: string = 'admin', reason?: string) => {
    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'job-payment',
          id,
          action: 'reject',
          adminId,
          reason,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchPending()
        return { success: true }
      }
      
      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: 'Failed to reject' }
    }
  }, [fetchPending])
  
  const approveJobAlert = useCallback(async (id: string, adminId: string = 'admin') => {
    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'job-alert',
          id,
          action: 'approve',
          adminId,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchPending()
        return { success: true }
      }
      
      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: 'Failed to approve' }
    }
  }, [fetchPending])
  
  const rejectJobAlert = useCallback(async (id: string, adminId: string = 'admin', reason?: string) => {
    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'job-alert',
          id,
          action: 'reject',
          adminId,
          reason,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchPending()
        return { success: true }
      }
      
      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: 'Failed to reject' }
    }
  }, [fetchPending])
  
  useEffect(() => {
    // Initial fetch
    fetchPending()
    
    // Set up polling
    intervalRef.current = setInterval(fetchPending, pollInterval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchPending, pollInterval])
  
  return {
    ...state,
    refresh: fetchPending,
    approveSubscription,
    rejectSubscription,
    approveJobPayment,
    rejectJobPayment,
    approveJobAlert,
    rejectJobAlert,
  }
}

// Hook for customer/employer to check their approval status
export function useApprovalStatus(userId: string | undefined, pollInterval = 2000) {
  const [isApproved, setIsApproved] = useState(false)
  const [approvalData, setApprovalData] = useState<Record<string, unknown> | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const checkApproval = useCallback(async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/sync?type=check-approval&userId=${userId}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      
      if (!response.ok) return
      
      const data = await response.json()
      
      if (data.success && data.approved) {
        setIsApproved(true)
        setApprovalData(data.data)
        
        // If this is a job payment approval, create the job in localStorage
        if (data.data?.type === 'job_payment' && data.data?.jobDetails) {
          createJobFromApproval(userId, data.data)
        }
        
        // Stop polling once approved
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
      
      setIsChecking(false)
    } catch (error) {
      console.error('[Realtime Sync] Check approval error:', error)
      setIsChecking(false)
    }
  }, [userId])
  
  useEffect(() => {
    if (!userId) {
      setIsChecking(false)
      return
    }
    
    // Initial check
    checkApproval()
    
    // Poll for approval
    intervalRef.current = setInterval(checkApproval, pollInterval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId, checkApproval, pollInterval])
  
  return { isApproved, approvalData, isChecking, refresh: checkApproval }
}

// Helper function to create a job from approval data
function createJobFromApproval(salonId: string, approvalData: Record<string, unknown>) {
  try {
    const jobDetails = approvalData.jobDetails as Record<string, unknown>
    if (!jobDetails) return
    
    // Create the live job in localStorage
    const jobsStr = localStorage.getItem('salonjobsindia_jobs')
    const jobs = jobsStr ? JSON.parse(jobsStr) : []
    
    // Check if job already exists
    const existingJob = jobs.find((j: any) => 
      j.id === approvalData.orderId || 
      (j.salonId === salonId && j.salonName === jobDetails.salonName && j.role === (jobDetails.role || jobDetails.customRole))
    )
    
    if (existingJob) {
      return
    }
    
    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      salonId: salonId,
      salonName: jobDetails.salonName || 'Unknown Salon',
      salonMobile: jobDetails.salonMobile || '',
      salonLogo: jobDetails.salonLogo || '',
      role: jobDetails.role || jobDetails.customRole || 'Staff',
      salary: jobDetails.salary || 'Negotiable',
      experience: jobDetails.experience || 'Any',
      description: jobDetails.description || '',
      location: jobDetails.location || { lat: 0, lng: 0, address: '' },
      status: 'live',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      paymentApprovedAt: approvalData.approvedAt,
    }
    
    jobs.push(newJob)
    localStorage.setItem('salonjobsindia_jobs', JSON.stringify(jobs))
    
    // Also update salon profile with 30 free credits if first job
    const profilesStr = localStorage.getItem('salonjobsindia_salon_profiles')
    const profiles = profilesStr ? JSON.parse(profilesStr) : []
    const profile = profiles.find((p: { ownerId: string }) => p.ownerId === salonId)
    
    if (profile && (!profile.contactCredits || profile.contactCredits === 0)) {
      profile.contactCredits = 30 // First job gets 30 free credits
      localStorage.setItem('salonjobsindia_salon_profiles', JSON.stringify(profiles))
    }
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('salonjobsindia_data_updated', { detail: { key: 'salonjobsindia_jobs' } }))
  } catch (error) {
    console.error('[Realtime Sync] Error creating job from approval:', error)
  }
}

// Function to submit a subscription payment
export async function submitSubscriptionPayment(data: {
  userId: string
  userName: string
  userPhone: string
  userEmail?: string
  userRole: string
  planId: string
  planName: string
  planPrice: number
  planDuration: number
  screenshotUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[Realtime Sync] Submitting subscription payment:`, { id, ...data })
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'subscription',
        data: { id, ...data },
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`[Realtime Sync] Subscription payment submitted successfully: ${id}`)
      return { success: true }
    }
    
    return { success: false, error: result.error }
  } catch (error) {
    console.error('[Realtime Sync] Submit subscription error:', error)
    return { success: false, error: 'Failed to submit payment' }
  }
}

// Function to submit a job payment (employer)
export async function submitJobPayment(data: {
  salonId: string
  salonName: string
  ownerName: string
  ownerPhone: string
  ownerEmail?: string
  jobTitle: string
  jobDetails: Record<string, unknown>
  planId: string
  planName: string
  planPrice: number
  screenshotUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[Realtime Sync] Submitting job payment:`, { id, ...data })
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'job-payment',
        data: { id, ...data },
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`[Realtime Sync] Job payment submitted successfully: ${id}`)
      return { success: true }
    }
    
    return { success: false, error: result.error }
  } catch (error) {
    console.error('[Realtime Sync] Submit job payment error:', error)
    return { success: false, error: 'Failed to submit payment' }
  }
}

// Function to submit a job alert (job seeker profile)
export async function submitJobAlert(data: {
  userId: string
  userName: string
  userPhone: string
  userEmail?: string
  role: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: { lat: number; lng: number; address: string }
  passportPhotoUrl?: string
  identityProofUrl?: string
  identityProofType?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[Realtime Sync] Submitting job alert:`, { id, ...data })
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'job-alert',
        data: { id, ...data },
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`[Realtime Sync] Job alert submitted successfully: ${id}`)
      return { success: true }
    }
    
    return { success: false, error: result.error }
  } catch (error) {
    console.error('[Realtime Sync] Submit job alert error:', error)
    return { success: false, error: 'Failed to submit job alert' }
  }
}
