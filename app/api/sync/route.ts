import { type NextRequest, NextResponse } from 'next/server'
import { createJob, getPendingJobs, approveJob, rejectJob, logSync, getSyncLogs } from '@/lib/db/jobs'
import { createApiError, validateRequired } from '@/lib/api-error-handler'

// GET - Retrieve pending jobs or sync logs
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')

  console.log(`[v0] [Sync API] GET request - type: ${type}`)

  try {
    if (type === 'pending-jobs' || type === 'pending-job-payments') {
      const result = await getPendingJobs()
      if (!result.success) {
        return createApiError('Failed to fetch pending jobs', 'SERVER_ERROR', 500)
      }
      console.log(`[v0] [Sync API] Returning ${result.data.length} pending jobs`)
      return NextResponse.json({ success: true, data: result.data, count: result.data.length, timestamp: Date.now() })
    }

    if (type === 'sync-logs') {
      const result = await getSyncLogs(100)
      if (!result.success) {
        return createApiError('Failed to fetch sync logs', 'SERVER_ERROR', 500)
      }
      console.log(`[v0] [Sync API] Returning ${result.data.length} sync log entries`)
      return NextResponse.json({ success: true, data: result.data, timestamp: Date.now() })
    }

    return createApiError('Invalid type parameter', 'INVALID_INPUT', 400, { type })
  } catch (error) {
    console.error('[v0] [Sync API] GET error:', error)
    return createApiError('Failed to fetch data', 'SERVER_ERROR', 500, { error: String(error) })
  }
}

// POST - Submit job payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`[v0] [Sync API] POST request - type: ${type}`)

    const validation = validateRequired(body, ['type', 'data'])
    if (!validation.valid) {
      return validation.error
    }

    if (type === 'job-payment') {
      console.log('[v0] [Sync API] Creating job in Supabase')
      
      // Create job in Supabase (use placeholder UUID if salonId is not a valid UUID)
      let ownerId = data.salonId
      
      // Check if it's a valid UUID format, otherwise use placeholder
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) {
        ownerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      }
      
      const jobResult = await createJob({
        owner_id: ownerId,
        title: data.jobTitle,
        description: data.jobDetails?.description || 'Job posting',
        salon_name: data.salonName,
        job_type: data.jobDetails?.jobType || 'full-time',
        skills: data.jobDetails?.skills || [],
        experience_required: data.jobDetails?.experience || 0,
        salary_min: data.jobDetails?.salary?.min || 0,
        salary_max: data.jobDetails?.salary?.max || 0,
        salary_currency: 'INR',
        salary_period: 'monthly',
        location_address: data.jobDetails?.location?.address || '',
        location_city: data.jobDetails?.location?.city || '',
        location_state: data.jobDetails?.location?.state || '',
        location_lat: data.jobDetails?.location?.lat || 0,
        location_lng: data.jobDetails?.location?.lng || 0,
        payment_screenshot_url: data.screenshotUrl,
        payment_amount: data.planPrice,
        payment_plan: data.planName,
        status: 'PAYMENT_PENDING',
        payment_status: 'pending',
        is_visible: false,
        visibility: 'private'
      })

      if (!jobResult.success) {
        console.error('[v0] [Sync API] Failed to create job:', jobResult.error)
        await logSync('job', 'unknown', 'create', 'supabase', 'failed', null, null, JSON.stringify(jobResult.error))
        const errorMessage = jobResult.error instanceof Error 
          ? jobResult.error.message 
          : typeof jobResult.error === 'object' && jobResult.error !== null && 'message' in jobResult.error
            ? (jobResult.error as any).message
            : JSON.stringify(jobResult.error)
        return createApiError('Failed to create job', 'SERVER_ERROR', 500, { details: errorMessage })
      }

      const jobId = jobResult.data.id
      console.log('[v0] [Sync API] Job created successfully:', jobId)
      
      // Log successful sync
      await logSync('job', jobId, 'create', 'supabase', 'success', null, jobResult.data)

      return NextResponse.json({ 
        success: true,
        message: 'Job submitted for payment review',
        jobId,
        data: jobResult.data
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[v0] [Sync API] POST error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}

// PUT - Approve/Reject job payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let { jobId, action, adminId, reason } = body

    // Validate admin UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminId)) {
      adminId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'  // Use placeholder admin UUID
    }

    console.log(`[v0] [Sync API] PUT request - jobId: ${jobId}, action: ${action}, adminId: ${adminId}`)

    if (action === 'approve') {
      const result = await approveJob(jobId, adminId)
      
      if (!result.success) {
        console.error('[v0] [Sync API] Failed to approve job:', result.error)
        await logSync('job', jobId, 'approve', 'supabase', 'failed', null, null, JSON.stringify(result.error))
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : typeof result.error === 'object' && result.error !== null && 'message' in result.error
            ? (result.error as any).message
            : JSON.stringify(result.error)
        return NextResponse.json({ 
          error: 'Failed to approve job',
          details: errorMessage
        }, { status: 500 })
      }

      console.log('[v0] [Sync API] Job approved successfully:', jobId)
      await logSync('job', jobId, 'approve', 'supabase', 'success', null, result.data)

      return NextResponse.json({
        success: true,
        message: 'Job approved and now LIVE',
        job: result.data
      })
    }

    if (action === 'reject') {
      const result = await rejectJob(jobId, adminId, reason || 'Rejected by admin')
      
      if (!result.success) {
        console.error('[v0] [Sync API] Failed to reject job:', result.error)
        await logSync('job', jobId, 'reject', 'supabase', 'failed', null, null, JSON.stringify(result.error))
        return NextResponse.json({ error: 'Failed to reject job' }, { status: 500 })
      }

      console.log('[v0] [Sync API] Job rejected successfully:', jobId)
      await logSync('job', jobId, 'reject', 'supabase', 'success', null, result.data)

      return NextResponse.json({
        success: true,
        message: 'Job rejected',
        job: result.data
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] [Sync API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
