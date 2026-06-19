import { createClient } from '@supabase/supabase-js'
import type { User, Subscription, SalonProfile } from './types'

let supabase: any = null

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side - return null to avoid issues
    return null
  }

  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[v0] Supabase credentials not configured')
      return null
    }

    supabase = createClient(supabaseUrl, supabaseKey)
  }

  return supabase
}

/**
 * Sync user profile to Supabase
 */
export async function syncUserToSupabase(user: User) {
  try {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Supabase not configured' }

    const { error } = await client.from('users').upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: new Date(user.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('[v0] Failed to sync user to Supabase:', error)
      return { success: false, error }
    }

    console.log('[v0] User synced to Supabase:', user.id)
    return { success: true }
  } catch (err) {
    console.error('[v0] Error syncing user:', err)
    return { success: false, error: err }
  }
}

/**
 * Sync job seeker profile to Supabase
 */
export async function syncJobSeekerToSupabase(jobSeeker: any) {
  try {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Supabase not configured' }

    const { error } = await client.from('job_seekers').upsert(
      {
        id: jobSeeker.id || jobSeeker.userId,
        user_id: jobSeeker.userId,
        name: jobSeeker.name,
        role: jobSeeker.role,
        experience: jobSeeker.experience,
        skills: jobSeeker.skills,
        location: jobSeeker.location,
        salary_expectation: jobSeeker.salaryExpectation,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      console.error('[v0] Failed to sync job seeker to Supabase:', error)
      return { success: false, error }
    }

    console.log('[v0] Job seeker synced to Supabase:', jobSeeker.userId)
    return { success: true }
  } catch (err) {
    console.error('[v0] Error syncing job seeker:', err)
    return { success: false, error: err }
  }
}

/**
 * Sync subscription to Supabase
 */
export async function syncSubscriptionToSupabase(subscription: Subscription) {
  try {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Supabase not configured' }

    const { error } = await client.from('subscriptions').upsert(
      {
        id: subscription.id,
        user_id: subscription.userId,
        plan_type: subscription.planType,
        plan_name: subscription.planName,
        amount: subscription.amount,
        status: subscription.status,
        expires_at: subscription.expiresAt ? new Date(subscription.expiresAt).toISOString() : null,
        created_at: new Date(subscription.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('[v0] Failed to sync subscription to Supabase:', error)
      return { success: false, error }
    }

    console.log('[v0] Subscription synced to Supabase:', subscription.id)
    return { success: true }
  } catch (err) {
    console.error('[v0] Error syncing subscription:', err)
    return { success: false, error: err }
  }
}

/**
 * Sync salon profile with credits to Supabase
 */
export async function syncSalonCreditsToSupabase(profile: SalonProfile) {
  try {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Supabase not configured' }

    const { error } = await client.from('salon_profiles').upsert(
      {
        id: profile.id,
        owner_id: profile.ownerId,
        salon_name: profile.salonName,
        mobile: profile.mobile,
        contact_credits: profile.contactCredits || 0,
        unlocked_candidates: profile.unlockedCandidates || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('[v0] Failed to sync salon credits to Supabase:', error)
      return { success: false, error }
    }

    console.log('[v0] Salon credits synced to Supabase:', profile.id)
    return { success: true }
  } catch (err) {
    console.error('[v0] Error syncing salon credits:', err)
    return { success: false, error: err }
  }
}

/**
 * Fetch pending jobs from Supabase
 */
export async function fetchPendingJobsFromSupabase() {
  try {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Supabase not configured', data: [] }

    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Failed to fetch pending jobs:', error)
      return { success: false, error, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (err) {
    console.error('[v0] Error fetching pending jobs:', err)
    return { success: false, error: err, data: [] }
  }
}

/**
 * Fetch live jobs from Supabase for job seekers
 */
export async function fetchLiveJobsFromSupabase(filters?: {
  location?: string
  role?: string
  salaryMin?: number
  salaryMax?: number
}) {
  try {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Supabase not configured', data: [] }

    let query = client
      .from('jobs')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters?.role) {
      query = query.ilike('title', `%${filters.role}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Failed to fetch live jobs:', error)
      return { success: false, error, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (err) {
    console.error('[v0] Error fetching live jobs:', err)
    return { success: false, error: err, data: [] }
  }
}
