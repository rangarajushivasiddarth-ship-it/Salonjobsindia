import { NextRequest, NextResponse } from 'next/server'
import { approveJob, rejectJob, getJobById } from '@/lib/db/jobs'

// POST - Approve or reject job payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, adminId, action, rejectionReason } = body

    if (!jobId || !adminId || !action) {
      console.warn('[v0] [API] Missing required fields for job approval')
      return NextResponse.json(
        { error: 'Missing required fields: jobId, adminId, action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      console.warn('[v0] [API] Invalid action:', action)
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get job to verify it exists and check status
    console.log('[v0] [API] Fetching job:', jobId)
    const jobResult = await getJobById(jobId)
    
    if (!jobResult.success || !jobResult.data) {
      console.error('[v0] [API] Job not found:', jobId)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const job = jobResult.data as any
    
    // Verify job is in PAYMENT_PENDING status
    console.log(`[v0] [API] Job status: ${job.status}, payment_status: ${job.payment_status}`)
    
    if (job.status !== 'PAYMENT_PENDING') {
      console.error(`[v0] [API] Job not in PAYMENT_PENDING status, actual: ${job.status}`)
      return NextResponse.json(
        { error: `Job is not in PAYMENT_PENDING status. Actual status: ${job.status}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      console.log(`[v0] [API] Approving job ${jobId}`)
      
      // Calculate expiration (30 days from now)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const approvalResult = await approveJob(jobId, adminId, expiresAt)

      if (!approvalResult.success) {
        console.error('[v0] [API] Error approving job:', approvalResult.error)
        return NextResponse.json(
          { error: 'Failed to approve job', details: approvalResult.error },
          { status: 500 }
        )
      }

      console.log(`[v0] [API] Job approved successfully: ${jobId}`)

      return NextResponse.json({
        success: true,
        message: 'Job approved and is now live. Job seekers can see it immediately.',
        jobId,
        newStatus: 'LIVE',
        data: approvalResult.data
      })
    } else {
      // Rejection
      console.log(`[v0] [API] Rejecting job ${jobId}`)
      
      const rejectionResult = await rejectJob(jobId, adminId, rejectionReason || 'Payment rejected by admin')

      if (!rejectionResult.success) {
        console.error('[v0] [API] Error rejecting job:', rejectionResult.error)
        return NextResponse.json(
          { error: 'Failed to reject job', details: rejectionResult.error },
          { status: 500 }
        )
      }

      console.log(`[v0] [API] Job rejected successfully: ${jobId}`)

      return NextResponse.json({
        success: true,
        message: 'Job payment rejected and returned to draft status.',
        jobId,
        newStatus: 'EXPIRED',
        data: rejectionResult.data
      })
    }
  } catch (error) {
    console.error('[v0] [API] Exception in approval endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
