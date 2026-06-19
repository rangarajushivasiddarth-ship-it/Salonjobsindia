'use client'

import { useState, useCallback } from 'react'

interface ApprovalState {
  isLoading: boolean
  error: string | null
  success: boolean
  lastApprovedId: string | null
}

export function usePaymentApproval() {
  const [state, setState] = useState<ApprovalState>({
    isLoading: false,
    error: null,
    success: false,
    lastApprovedId: null,
  })

  const approvePayment = useCallback(async (
    jobId: string,
    type: 'job_publishing' | 'job_seeker_subscription' | 'contact_pack'
  ): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, success: false }))
    
    try {
      const response = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'approve',
          adminId: 'admin',
        }),
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Failed to approve payment'
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg, success: false }))
        return { success: false, error: errorMsg }
      }

      // Mark success with delay to show UI feedback
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        success: true,
        lastApprovedId: jobId,
      }))

      // Reset success state after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: false }))
      }, 2000)

      // Force refetch of all data by dispatching global event
      window.dispatchEvent(new CustomEvent('salonjobsindia_payment_approved', {
        detail: { jobId, type },
      }))

      console.log('[v0] Payment approved and revalidation triggered:', jobId)

      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg, success: false }))
      return { success: false, error: errorMsg }
    }
  }, [])

  const rejectPayment = useCallback(async (
    jobId: string,
    type: 'job_publishing' | 'job_seeker_subscription' | 'contact_pack',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, success: false }))
    
    try {
      const response = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'reject',
          reason,
          adminId: 'admin',
        }),
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Failed to reject payment'
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg, success: false }))
        return { success: false, error: errorMsg }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        success: true,
        lastApprovedId: jobId,
      }))

      setTimeout(() => {
        setState(prev => ({ ...prev, success: false }))
      }, 2000)

      window.dispatchEvent(new CustomEvent('salonjobsindia_payment_rejected', {
        detail: { jobId, type },
      }))

      console.log('[v0] Payment rejected and revalidation triggered:', jobId)

      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg, success: false }))
      return { success: false, error: errorMsg }
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    approvePayment,
    rejectPayment,
    clearError,
  }
}
