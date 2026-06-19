import { createClient } from '@/lib/supabase/server'

export type SyncAction = 'create' | 'update' | 'delete' | 'approve' | 'reject'
export type SyncEntity = 'job' | 'payment' | 'user_profile' | 'application'

export interface SyncLogEntry {
  entity_type: SyncEntity
  entity_id: string
  action: SyncAction
  source: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  status: 'success' | 'failed'
  error_message?: string
}

/**
 * Log a sync operation to track all changes for perfect data consistency
 * Ensures admin and customer data stays in perfect sync
 */
export async function logSync(entry: SyncLogEntry) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('sync_logs')
      .insert({
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        source: entry.source,
        old_data: entry.old_data || null,
        new_data: entry.new_data || null,
        status: entry.status,
        error_message: entry.error_message || null,
        created_at: new Date().toISOString(),
        synced_at: entry.status === 'success' ? new Date().toISOString() : null,
      })

    if (error) {
      console.error('[v0] Sync log error:', error)
    }
  } catch (err) {
    console.error('[v0] Failed to log sync:', err)
  }
}

/**
 * Get sync history for an entity to verify data consistency
 */
export async function getSyncHistory(entityId: string, entityType: SyncEntity) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[v0] Error fetching sync history:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[v0] Failed to get sync history:', err)
    return []
  }
}

/**
 * Verify data consistency between admin view and customer view
 */
export async function verifyDataConsistency(jobId: string) {
  try {
    const supabase = await createClient()

    // Get the job from database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError) {
      return { consistent: false, error: 'Job not found' }
    }

    // Get the latest sync logs for this job
    const history = await getSyncHistory(jobId, 'job')

    // Verify state matches latest log
    const latestLog = history[0]
    if (!latestLog) {
      return { consistent: true, message: 'No sync history yet' }
    }

    // Check if job state matches the latest logged state
    const jobState = {
      status: job.status,
      payment_status: job.payment_status,
      is_visible: job.is_visible,
      is_live: job.is_live,
    }

    const loggedState = latestLog.new_data as Record<string, unknown>
    const isConsistent = 
      jobState.status === loggedState.status &&
      jobState.payment_status === loggedState.payment_status &&
      jobState.is_visible === loggedState.is_visible &&
      jobState.is_live === loggedState.is_live

    return { 
      consistent: isConsistent, 
      jobState,
      lastSync: latestLog.synced_at,
      lastAction: latestLog.action
    }
  } catch (err) {
    console.error('[v0] Data consistency check failed:', err)
    return { consistent: false, error: 'Verification failed' }
  }
}
