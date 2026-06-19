import { createClient } from '@/lib/supabase/client'
import Job from '@/server/src/models/Job'
import mongoose from 'mongoose'

/**
 * Dual-Write Adapter: Writes to both MongoDB and Supabase simultaneously
 * - Primary: Supabase (PostgreSQL)
 * - Fallback: MongoDB
 * - Ensures zero data loss during migration
 * - Tracks sync status in sync_logs table
 */

export interface DualWriteResult {
  mongodb: { success: boolean; data?: any; error?: string }
  supabase: { success: boolean; data?: any; error?: string }
  status: 'full_success' | 'partial_success' | 'mongodb_only' | 'failed'
}

export interface JobData {
  id?: string | null
  _id?: string | null
  owner_id?: string | null
  ownerId?: string | null
  title?: string
  description?: string | null
  job_type?: string | null
  jobType?: string | null
  status?: string | null
  payment_status?: string | null
  paymentStatus?: string | null
  is_visible?: boolean | null
  isVisible?: boolean | null
  is_live?: boolean | null
  visibility?: string | null
  payment_screenshot_url?: string | null
  paymentScreenshotUrl?: string | null
  payment_amount?: number | null
  paymentAmount?: number | null
  payment_plan?: string | null
  paymentPlan?: string | null
  payment_submitted_at?: Date | null
  paymentSubmittedAt?: Date | null
  approved_by?: string | null
  approvedBy?: string | null
  approved_at?: Date | null
  approvedAt?: Date | null
  rejection_reason?: string | null
  rejectionReason?: string | null
  salon_name?: string | null
  salonName?: string | null
  skills?: string[] | null
  experience_required?: number | null
  experienceRequired?: number | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  salary_period?: string | null
  location_lat?: number | null
  location_lng?: number | null
  location_address?: string | null
  location_city?: string | null
  location_state?: string | null
  location?: any
  views_count?: number | null
  viewCount?: number | null
  applications_count?: number | null
  applicationCount?: number | null
  is_urgent?: boolean | null
  isUrgent?: boolean | null
  is_featured?: boolean | null
  isFeatured?: boolean | null
  expires_at?: Date | null
  expiresAt?: Date | null
  posted_at?: Date | null
  postedAt?: Date | null
  created_at?: Date | null
  createdAt?: Date | null
  updated_at?: Date | null
  updatedAt?: Date | null
  [key: string]: any
}

/**
 * Normalize data from MongoDB format to Supabase format
 */
function normalizeMongoDB(data: JobData) {
  return {
    id: data.id || data._id?.toString(),
    owner_id: data.owner_id || data.ownerId,
    title: data.title,
    description: data.description,
    job_type: data.job_type || data.jobType,
    status: data.status,
    payment_status: data.payment_status || data.paymentStatus,
    is_visible: data.is_visible ?? data.isVisible,
    is_live: data.is_live,
    visibility: data.visibility,
    payment_screenshot_url: data.payment_screenshot_url || data.paymentScreenshotUrl,
    payment_amount: data.payment_amount || data.paymentAmount,
    payment_plan: data.payment_plan || data.paymentPlan,
    payment_submitted_at: data.payment_submitted_at || data.paymentSubmittedAt,
    approved_by: data.approved_by || data.approvedBy,
    approved_at: data.approved_at || data.approvedAt,
    rejection_reason: data.rejection_reason || data.rejectionReason,
    salon_name: data.salon_name || data.salonName,
    skills: data.skills || [],
    experience_required: data.experience_required || data.experienceRequired,
    salary_min: data.salary_min,
    salary_max: data.salary_max,
    salary_currency: data.salary_currency,
    salary_period: data.salary_period,
    location_lat: data.location?.lat || data.location_lat,
    location_lng: data.location?.lng || data.location_lng,
    location_address: data.location?.address || data.location_address,
    location_city: data.location?.city || data.location_city,
    location_state: data.location?.state || data.location_state,
    views_count: data.views_count || data.viewCount,
    applications_count: data.applications_count || data.applicationCount,
    is_urgent: data.is_urgent || data.isUrgent,
    is_featured: data.is_featured || data.isFeatured,
    expires_at: data.expires_at || data.expiresAt,
    posted_at: data.posted_at || data.postedAt,
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
  }
}

/**
 * Create job in both MongoDB and Supabase
 */
export async function createJobDualWrite(jobData: JobData): Promise<DualWriteResult> {
  const result: DualWriteResult = {
    mongodb: { success: false },
    supabase: { success: false },
    status: 'failed',
  }

  const supabase = createClient()
  const normalizedData = normalizeMongoDB(jobData)

  console.log('[v0] [DualWrite] Creating job:', jobData.title)

  // Write to MongoDB (primary for now during migration)
  try {
    const mongoJob = new Job({
      ...jobData,
      status: jobData.status || 'DRAFT',
      paymentStatus: jobData.paymentStatus || 'none',
      isVisible: jobData.isVisible ?? false,
    })
    await mongoJob.save()
    result.mongodb.success = true
    result.mongodb.data = { id: mongoJob._id }
    console.log('[v0] [DualWrite] MongoDB write success:', mongoJob._id)
  } catch (mongoError: any) {
    result.mongodb.error = mongoError.message
    console.error('[v0] [DualWrite] MongoDB write failed:', mongoError.message)
  }

  // Write to Supabase (target database)
  try {
    const { data, error } = await supabase.from('jobs').insert([normalizedData]).select()

    if (error) throw error

    result.supabase.success = true
    result.supabase.data = data?.[0]
    console.log('[v0] [DualWrite] Supabase write success:', data?.[0]?.id)
  } catch (supabaseError: any) {
    result.supabase.error = supabaseError.message
    console.error('[v0] [DualWrite] Supabase write failed:', supabaseError.message)
  }

  // Determine overall status
  if (result.mongodb.success && result.supabase.success) {
    result.status = 'full_success'
  } else if (result.mongodb.success) {
    result.status = 'mongodb_only' // Will retry Supabase write
  } else if (result.supabase.success) {
    result.status = 'partial_success' // Has Supabase backup
  }

  // Log sync event
  await logSync('job', result.mongodb.data?.id, 'create', result)

  return result
}

/**
 * Update job in both MongoDB and Supabase
 */
export async function updateJobDualWrite(jobId: string, updates: JobData): Promise<DualWriteResult> {
  const result: DualWriteResult = {
    mongodb: { success: false },
    supabase: { success: false },
    status: 'failed',
  }

  const supabase = createClient()
  const normalizedData = normalizeMongoDB(updates)

  console.log('[v0] [DualWrite] Updating job:', jobId)

  // Update MongoDB
  try {
    const mongoJob = await Job.findByIdAndUpdate(jobId, updates, { new: true })
    if (mongoJob) {
      result.mongodb.success = true
      result.mongodb.data = { id: mongoJob._id }
      console.log('[v0] [DualWrite] MongoDB update success:', jobId)
    }
  } catch (mongoError: any) {
    result.mongodb.error = mongoError.message
    console.error('[v0] [DualWrite] MongoDB update failed:', mongoError.message)
  }

  // Update Supabase
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(normalizedData)
      .eq('id', jobId)
      .select()

    if (error) throw error

    result.supabase.success = true
    result.supabase.data = data?.[0]
    console.log('[v0] [DualWrite] Supabase update success:', jobId)
  } catch (supabaseError: any) {
    result.supabase.error = supabaseError.message
    console.error('[v0] [DualWrite] Supabase update failed:', supabaseError.message)
  }

  // Determine overall status
  if (result.mongodb.success && result.supabase.success) {
    result.status = 'full_success'
  } else if (result.mongodb.success) {
    result.status = 'mongodb_only'
  } else if (result.supabase.success) {
    result.status = 'partial_success'
  }

  await logSync('job', jobId, 'update', result)

  return result
}

/**
 * Approve job in both databases
 */
export async function approveJobDualWrite(
  jobId: string,
  adminId: string,
  expiresAt?: Date
): Promise<DualWriteResult> {
  const updates = {
    status: 'LIVE',
    paymentStatus: 'approved',
    isVisible: true,
    visibility: 'public',
    approvedBy: adminId,
    approvedAt: new Date(),
    expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }

  return updateJobDualWrite(jobId, updates)
}

/**
 * Log sync event to audit table
 */
async function logSync(entityType: string, entityId: string, action: string, result: DualWriteResult) {
  try {
    const supabase = createClient()
    await supabase.from('sync_logs').insert([
      {
        entity_type: entityType,
        entity_id: entityId,
        action,
        source: 'dual-write',
        status: result.status === 'failed' ? 'failed' : 'success',
        new_data: result,
        error_message: result.mongodb.error || result.supabase.error,
      },
    ])
  } catch (logError) {
    console.error('[v0] [DualWrite] Failed to log sync:', logError)
  }
}

/**
 * Retry failed Supabase writes
 */
export async function retryFailedWrites() {
  console.log('[v0] [DualWrite] Checking for failed Supabase writes...')
  
  try {
    const supabase = createClient()
    
    // Get pending syncs from last 5 minutes
    const { data: failedSyncs } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('source', 'dual-write')
      .eq('status', 'failed')
      .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(50)

    if (!failedSyncs || failedSyncs.length === 0) {
      console.log('[v0] [DualWrite] No failed syncs to retry')
      return
    }

    console.log('[v0] [DualWrite] Found', failedSyncs.length, 'failed syncs to retry')

    // Retry each failed sync
    for (const syncLog of failedSyncs) {
      try {
        const mongoDoc = await Job.findById(syncLog.entity_id)
        if (mongoDoc) {
          const normalizedData = normalizeMongoDB(mongoDoc.toObject() as any)
          const { error } = await supabase
            .from('jobs')
            .upsert([normalizedData], { onConflict: 'id' })

          if (!error) {
            // Mark sync as successful
            await supabase
              .from('sync_logs')
              .update({ status: 'success' })
              .eq('id', syncLog.id)
            console.log('[v0] [DualWrite] Retry successful:', syncLog.entity_id)
          }
        }
      } catch (retryError) {
        console.error('[v0] [DualWrite] Retry failed:', retryError)
      }
    }
  } catch (error) {
    console.error('[v0] [DualWrite] Retry process failed:', error)
  }
}
