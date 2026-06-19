import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client lazily to avoid issues during build time
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not set')
  }
  
  return createClient(url, key)
}

export interface JobInput {
  owner_id?: string | null
  title: string
  description?: string
  salon_name?: string
  job_type?: string
  skills?: string[]
  experience_required?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  location_address?: string
  location_city?: string
  location_state?: string
  location_lat?: number
  location_lng?: number
  payment_screenshot_url?: string
  payment_amount?: number
  payment_plan?: string
  status?: string
  payment_status?: string
  is_visible?: boolean
  visibility?: string
}

export async function createJob(jobData: JobInput) {
  console.log('[v0] [DB] Creating job in Supabase:', jobData.title)
  
  try {
    const supabase = getSupabaseClient()
    
    // Verify owner_id exists in users table if provided
    let validOwnerId = jobData.owner_id || null
    if (validOwnerId) {
      try {
        const { data: ownerExists } = await supabase
          .from('users')
          .select('id')
          .eq('id', validOwnerId)
          .single()
        
        if (!ownerExists) {
          console.warn('[v0] [DB] Owner ID does not exist in users table, using NULL')
          validOwnerId = null
        }
      } catch (err) {
        console.warn('[v0] [DB] Error checking owner existence, using NULL')
        validOwnerId = null
      }
    }
    
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          owner_id: validOwnerId,
          title: jobData.title,
          description: jobData.description || null,
          salon_name: jobData.salon_name || null,
          job_type: jobData.job_type || 'full-time',
          skills: jobData.skills || [],
          experience_required: jobData.experience_required || 0,
          salary_min: jobData.salary_min || 0,
          salary_max: jobData.salary_max || 0,
          salary_currency: jobData.salary_currency || 'INR',
          salary_period: jobData.salary_period || 'monthly',
          location_address: jobData.location_address || null,
          location_city: jobData.location_city || null,
          location_state: jobData.location_state || null,
          location_lat: jobData.location_lat || 0,
          location_lng: jobData.location_lng || 0,
          payment_screenshot_url: jobData.payment_screenshot_url || null,
          payment_amount: jobData.payment_amount || 0,
          payment_plan: jobData.payment_plan || null,
          payment_submitted_at: new Date().toISOString(),
          status: jobData.status || 'PAYMENT_PENDING',
          payment_status: jobData.payment_status || 'pending',
          is_visible: jobData.is_visible ?? false,
          is_live: false,
          visibility: jobData.visibility || 'private',
          posted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) {
      console.error('[v0] [DB] Error creating job:', error)
      throw error
    }

    console.log('[v0] [DB] Job created successfully:', data?.[0]?.id)
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] [DB] Exception creating job:', error)
    return { success: false, error }
  }
}

export async function getPendingJobs() {
  console.log('[v0] [DB] Fetching pending jobs from Supabase')
  
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'PAYMENT_PENDING')
      .eq('payment_status', 'pending')
      .order('payment_submitted_at', { ascending: false })

    if (error) {
      console.error('[v0] [DB] Error fetching pending jobs:', error)
      throw error
    }

    console.log('[v0] [DB] Found', data?.length || 0, 'pending jobs')
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[v0] [DB] Exception fetching pending jobs:', error)
    return { success: false, error, data: [] }
  }
}

export async function getLiveJobs(city?: string, search?: string) {
  console.log('[v0] [DB] Fetching live jobs from Supabase - city:', city, 'search:', search)
  
  try {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'LIVE')
      .eq('is_visible', true)
      .eq('payment_status', 'approved')
      .order('posted_at', { ascending: false })

    if (city) {
      query = query.ilike('location_city', `%${city}%`)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] [DB] Error fetching live jobs:', error)
      throw error
    }

    console.log('[v0] [DB] Found', data?.length || 0, 'live jobs')
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[v0] [DB] Exception fetching live jobs:', error)
    return { success: false, error, data: [] }
  }
}

export async function getJobById(jobId: string) {
  console.log('[v0] [DB] Fetching job by ID:', jobId)
  
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      console.error('[v0] [DB] Error fetching job:', error)
      throw error
    }

    console.log('[v0] [DB] Job found:', data?.title)
    return { success: true, data }
  } catch (error) {
    console.error('[v0] [DB] Exception fetching job:', error)
    return { success: false, error }
  }
}

export async function approveJob(jobId: string, adminId?: string, expiresAt?: string) {
  console.log('[v0] [DB] Approving job:', jobId, 'by admin:', adminId || 'system')
  
  try {
    const supabase = getSupabaseClient()
    
    // Build update object - DO NOT include approved_by to avoid FK constraint
    const updateData: any = {
      status: 'LIVE',
      payment_status: 'approved',
      is_visible: true,
      is_live: true,
      visibility: 'public',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    if (expiresAt) {
      updateData.expires_at = expiresAt
    }
    
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()

    if (error) {
      console.error('[v0] [DB] Error approving job:', error)
      throw error
    }

    console.log('[v0] [DB] Job approved successfully:', jobId)
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] [DB] Exception approving job:', error)
    return { success: false, error }
  }
}

export async function rejectJob(jobId: string, adminId: string, reason: string) {
  console.log('[v0] [DB] Rejecting job:', jobId, 'by admin:', adminId)
  
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status: 'EXPIRED',
        payment_status: 'rejected',
        rejection_reason: reason,
        is_visible: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()

    if (error) {
      console.error('[v0] [DB] Error rejecting job:', error)
      throw error
    }

    console.log('[v0] [DB] Job rejected successfully:', jobId)
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] [DB] Exception rejecting job:', error)
    return { success: false, error }
  }
}

export async function getSyncLogs(limit = 50) {
  console.log('[v0] [DB] Fetching sync logs - limit:', limit)
  
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[v0] [DB] Error fetching sync logs:', error)
      throw error
    }

    console.log('[v0] [DB] Retrieved', data?.length || 0, 'sync log entries')
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[v0] [DB] Exception fetching sync logs:', error)
    return { success: false, error, data: [] }
  }
}

export async function logSync(
  entityType: string,
  entityId: string,
  action: string,
  source: string,
  status: string,
  oldData?: any,
  newData?: any,
  errorMessage?: string
) {
  console.log('[v0] [DB] Logging sync:', entityType, entityId, action, source, status)
  
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('sync_logs')
      .insert([
        {
          entity_type: entityType,
          entity_id: entityId,
          action,
          source,
          status,
          old_data: oldData || null,
          new_data: newData || null,
          error_message: errorMessage || null,
          created_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) {
      console.error('[v0] [DB] Error logging sync:', error)
      throw error
    }

    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] [DB] Exception logging sync:', error)
    return { success: false, error }
  }
}
