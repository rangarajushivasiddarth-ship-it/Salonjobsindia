import { useEffect, useState, useCallback } from 'react'
import { getSupabaseClientSide } from '@/lib/supabase-service'

// Hook for admin payment approvals realtime sync
export function usePaymentApprovals() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClientSide()

    // Initial fetch
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (!error) {
          setPayments(data || [])
        }
      } catch (err) {
        console.error('[v0] Error fetching payments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('payments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload: any) => {
          console.log('[v0] Payment update received:', payload)
          
          if (payload.eventType === 'INSERT') {
            setPayments(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPayments(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new : p)
            )
          } else if (payload.eventType === 'DELETE') {
            setPayments(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { payments, loading }
}

// Hook for job updates realtime sync
export function useJobUpdates(salonOwnerId: string) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClientSide()

    // Initial fetch
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('owner_id', salonOwnerId)
          .order('created_at', { ascending: false })

        if (!error) {
          setJobs(data || [])
        }
      } catch (err) {
        console.error('[v0] Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()

    // Subscribe to realtime changes for this salon owner
    const subscription = supabase
      .channel(`jobs-${salonOwnerId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs',
          filter: `owner_id=eq.${salonOwnerId}`
        },
        (payload: any) => {
          console.log('[v0] Job update received:', payload)
          
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => 
              prev.map(j => j.id === payload.new.id ? payload.new : j)
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => prev.filter(j => j.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [salonOwnerId])

  return { jobs, loading }
}

// Hook for applications realtime sync
export function useApplications(jobSeekerId: string) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClientSide()

    // Initial fetch
    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('job_seeker_id', jobSeekerId)
          .order('created_at', { ascending: false })

        if (!error) {
          setApplications(data || [])
        }
      } catch (err) {
        console.error('[v0] Error fetching applications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`applications-${jobSeekerId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'applications',
          filter: `job_seeker_id=eq.${jobSeekerId}`
        },
        (payload: any) => {
          console.log('[v0] Application update received:', payload)
          
          if (payload.eventType === 'INSERT') {
            setApplications(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setApplications(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new : a)
            )
          } else if (payload.eventType === 'DELETE') {
            setApplications(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [jobSeekerId])

  return { applications, loading }
}

// Hook for live jobs sync
export function useLiveJobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClientSide()

    // Initial fetch
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_live', true)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        if (!error) {
          setJobs(data || [])
        }
      } catch (err) {
        console.error('[v0] Error fetching live jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('live-jobs')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs'
        },
        (payload: any) => {
          console.log('[v0] Job update received:', payload)
          
          const isLiveAndApproved = payload.new?.is_live && payload.new?.status === 'approved'
          
          if (payload.eventType === 'INSERT' && isLiveAndApproved) {
            setJobs(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            if (isLiveAndApproved) {
              setJobs(prev => 
                prev.some(j => j.id === payload.new.id)
                  ? prev.map(j => j.id === payload.new.id ? payload.new : j)
                  : [payload.new, ...prev]
              )
            } else {
              setJobs(prev => prev.filter(j => j.id !== payload.old.id))
            }
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => prev.filter(j => j.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { jobs, loading }
}

// Hook for credits sync
export function useCreditsSync(userId: string) {
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClientSide()

    // Initial fetch
    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('salon_owners')
          .select('credits')
          .eq('user_id', userId)
          .single()

        if (!error && data) {
          setCredits(data.credits)
        }
      } catch (err) {
        console.error('[v0] Error fetching credits:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`credits-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'salon_owners',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('[v0] Credits update received:', payload.new.credits)
          setCredits(payload.new.credits)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { credits, loading }
}
