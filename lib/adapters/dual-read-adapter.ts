/**
 * DUAL-READ ADAPTER: Query Supabase First, Fallback to MongoDB
 * ============================================================
 * 
 * This adapter provides a unified read interface that:
 * 1. Queries Supabase first (primary)
 * 2. Falls back to MongoDB if Supabase fails
 * 3. Logs performance metrics and errors
 * 4. Ensures data consistency
 */

import { createClient } from '@/lib/supabase/server'
import Job from '@/server/src/models/Job'
import { ObjectId } from 'mongodb'

export interface DualReadResult<T> {
  data: T
  source: 'supabase' | 'mongodb'
  duration: number
  error?: string
}

export interface QueryMetrics {
  supabaseTime: number
  mongodbTime: number
  source: 'supabase' | 'mongodb'
  success: boolean
  error?: string
}

const METRICS_LOG: QueryMetrics[] = []

// Get all pending jobs for admin (PAYMENT_PENDING status)
export async function getPendingJobs(limit = 50): Promise<DualReadResult<any[]>> {
  const startTime = Date.now()
  console.log('[v0] [DualRead] Fetching pending jobs (limit: ' + limit + ')')

  // Try Supabase first
  try {
    const supabaseStart = Date.now()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'PAYMENT_PENDING')
      .order('payment_submitted_at', { ascending: false })
      .limit(limit)

    const supabaseTime = Date.now() - supabaseStart

    if (!error && data) {
      const duration = Date.now() - startTime
      console.log('[v0] [DualRead] Supabase: Found ' + data.length + ' pending jobs in ' + supabaseTime + 'ms')
      
      METRICS_LOG.push({
        supabaseTime,
        mongodbTime: 0,
        source: 'supabase',
        success: true
      })

      return {
        data,
        source: 'supabase',
        duration
      }
    }
  } catch (supabaseError) {
    console.log('[v0] [DualRead] Supabase failed: ' + (supabaseError as any).message)
  }

  // Fallback to MongoDB
  try {
    const mongoStart = Date.now()
    const jobs = await Job.find({ status: 'PAYMENT_PENDING' })
      .sort({ paymentSubmittedAt: -1 })
      .limit(limit)
      .lean()

    const mongodbTime = Date.now() - mongoStart
    const duration = Date.now() - startTime

    console.log('[v0] [DualRead] MongoDB: Found ' + jobs.length + ' pending jobs in ' + mongodbTime + 'ms')

    METRICS_LOG.push({
      supabaseTime: 999,
      mongodbTime,
      source: 'mongodb',
      success: true
    })

    return {
      data: jobs,
      source: 'mongodb',
      duration
    }
  } catch (mongoError) {
    console.error('[v0] [DualRead] Both sources failed')
    METRICS_LOG.push({
      supabaseTime: 999,
      mongodbTime: 999,
      source: 'mongodb',
      success: false,
      error: (mongoError as any).message
    })

    return {
      data: [],
      source: 'mongodb',
      duration: Date.now() - startTime,
      error: 'Both Supabase and MongoDB failed'
    }
  }
}

// Get all live jobs for job seekers
export async function getLiveJobs(
  city?: string,
  search?: string,
  limit = 50
): Promise<DualReadResult<any[]>> {
  const startTime = Date.now()
  console.log('[v0] [DualRead] Fetching live jobs (city: ' + city + ', search: ' + search + ')')

  // Try Supabase first
  try {
    const supabaseStart = Date.now()
    const supabase = await createClient()

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'LIVE')
      .eq('is_visible', true)
      .eq('payment_status', 'approved')

    if (city) {
      query = query.ilike('location_city', '%' + city + '%')
    }

    if (search) {
      query = query.or('title.ilike.%' + search + '%,description.ilike.%' + search + '%')
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

    const supabaseTime = Date.now() - supabaseStart

    if (!error && data) {
      const duration = Date.now() - startTime
      console.log('[v0] [DualRead] Supabase: Found ' + data.length + ' live jobs in ' + supabaseTime + 'ms')

      METRICS_LOG.push({
        supabaseTime,
        mongodbTime: 0,
        source: 'supabase',
        success: true
      })

      return {
        data,
        source: 'supabase',
        duration
      }
    }
  } catch (supabaseError) {
    console.log('[v0] [DualRead] Supabase failed: ' + (supabaseError as any).message)
  }

  // Fallback to MongoDB
  try {
    const mongoStart = Date.now()
    const filter: any = {
      status: 'LIVE',
      isVisible: true,
      paymentStatus: 'approved'
    }

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(limit).lean()

    const mongodbTime = Date.now() - mongoStart
    const duration = Date.now() - startTime

    console.log('[v0] [DualRead] MongoDB: Found ' + jobs.length + ' live jobs in ' + mongodbTime + 'ms')

    METRICS_LOG.push({
      supabaseTime: 999,
      mongodbTime,
      source: 'mongodb',
      success: true
    })

    return {
      data: jobs,
      source: 'mongodb',
      duration
    }
  } catch (mongoError) {
    console.error('[v0] [DualRead] Both sources failed')
    METRICS_LOG.push({
      supabaseTime: 999,
      mongodbTime: 999,
      source: 'mongodb',
      success: false,
      error: (mongoError as any).message
    })

    return {
      data: [],
      source: 'mongodb',
      duration: Date.now() - startTime,
      error: 'Both Supabase and MongoDB failed'
    }
  }
}

// Get job by ID
export async function getJobById(jobId: string): Promise<DualReadResult<any>> {
  const startTime = Date.now()
  console.log('[v0] [DualRead] Fetching job: ' + jobId)

  // Try Supabase first
  try {
    const supabaseStart = Date.now()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    const supabaseTime = Date.now() - supabaseStart

    if (!error && data) {
      const duration = Date.now() - startTime
      console.log('[v0] [DualRead] Supabase: Found job in ' + supabaseTime + 'ms')

      METRICS_LOG.push({
        supabaseTime,
        mongodbTime: 0,
        source: 'supabase',
        success: true
      })

      return {
        data,
        source: 'supabase',
        duration
      }
    }
  } catch (supabaseError) {
    console.log('[v0] [DualRead] Supabase failed: ' + (supabaseError as any).message)
  }

  // Fallback to MongoDB
  try {
    const mongoStart = Date.now()
    const job = await Job.findById(jobId).lean()

    const mongodbTime = Date.now() - mongoStart
    const duration = Date.now() - startTime

    if (job) {
      console.log('[v0] [DualRead] MongoDB: Found job in ' + mongodbTime + 'ms')

      METRICS_LOG.push({
        supabaseTime: 999,
        mongodbTime,
        source: 'mongodb',
        success: true
      })

      return {
        data: job,
        source: 'mongodb',
        duration
      }
    }
  } catch (mongoError) {
    console.error('[v0] [DualRead] Both sources failed')
  }

  METRICS_LOG.push({
    supabaseTime: 999,
    mongodbTime: 999,
    source: 'mongodb',
    success: false,
    error: 'Job not found'
  })

  return {
    data: null,
    source: 'mongodb',
    duration: Date.now() - startTime,
    error: 'Job not found'
  }
}

// Get metrics for monitoring
export function getMetrics(hours = 1): any {
  const now = Date.now()
  const cutoff = now - hours * 60 * 60 * 1000

  const recentMetrics = METRICS_LOG.slice(-1000) // Keep last 1000 queries

  const supabaseQueries = recentMetrics.filter(m => m.source === 'supabase')
  const mongodbQueries = recentMetrics.filter(m => m.source === 'mongodb')
  const successQueries = recentMetrics.filter(m => m.success)

  const avgSupabaseTime = supabaseQueries.length > 0
    ? Math.round(supabaseQueries.reduce((sum, m) => sum + m.supabaseTime, 0) / supabaseQueries.length)
    : 0

  const avgMongodbTime = mongodbQueries.length > 0
    ? Math.round(mongodbQueries.reduce((sum, m) => sum + m.mongodbTime, 0) / mongodbQueries.length)
    : 0

  const successRate = recentMetrics.length > 0
    ? Math.round((successQueries.length / recentMetrics.length) * 100)
    : 0

  return {
    totalQueries: recentMetrics.length,
    supabaseQueries: supabaseQueries.length,
    mongodbQueries: mongodbQueries.length,
    successRate: successRate + '%',
    avgSupabaseTime: avgSupabaseTime + 'ms',
    avgMongodbTime: avgMongodbTime + 'ms',
    preferredSource: supabaseQueries.length > mongodbQueries.length ? 'supabase' : 'mongodb',
    readiness: supabaseQueries.length > mongodbQueries.length * 3 ? 'READY_FOR_SUPABASE_ONLY' : 'KEEP_DUAL_READ'
  }
}

// Clear metrics
export function clearMetrics(): void {
  METRICS_LOG.length = 0
  console.log('[v0] [DualRead] Metrics cleared')
}
