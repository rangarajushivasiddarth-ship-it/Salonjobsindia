import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logSync, verifyDataConsistency } from '@/lib/sync-logs'

/**
 * POST - Admin approve or reject payment (job posting or credit/badge)
 * Perfect sync: Single atomic transaction → Both admin and customer see changes instantly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, paymentId, action, reason, adminId, type } = body

    // Validate required fields
    if (!action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, adminId' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Either jobId or paymentId must be provided
    if (!jobId && !paymentId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId or paymentId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    console.log('[v0] Payment approval request:', { jobId, paymentId, action, type })

    // CASE 1: Credit/Badge Payment Approval
    if (paymentId && !jobId) {
      console.log(`[v0] Admin ${adminId} ${action}ing credit/badge payment: ${paymentId}`)
      
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (paymentError || !payment) {
        console.error('[v0] Payment not found:', paymentError)
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      const oldPaymentState = {
        status: payment.status,
      }

      if (action === 'approve') {
        // Update payment status to approved
        const { data: updatedPayment, error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'approved',
            approved_by: adminId,
            approved_at: new Date().toISOString(),
          })
          .eq('id', paymentId)
          .select()
          .single()

        if (updateError) {
          console.error('[v0] Error approving payment:', updateError)
          return NextResponse.json(
            { error: 'Failed to approve payment' },
            { status: 500 }
          )
        }

        console.log(`[v0] Credit/badge payment approved: ${paymentId}`)

        // Also update salon profile if this is a verified badge
        if (payment.type === 'verified_badge' && payment.user_id) {
          await supabase
            .from('users')
            .update({
              is_verified: true,
              verified_at: new Date().toISOString(),
            })
            .eq('id', payment.user_id)
        }

        return NextResponse.json({
          success: true,
          message: `${payment.type === 'verified_badge' ? 'Verified badge' : 'Credits'} approved successfully`,
          paymentId,
          status: 'approved',
        })
      } else {
        // Reject payment
        const { data: updatedPayment, error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'rejected',
            rejection_reason: reason || 'Rejected by admin',
            approved_by: adminId,
            approved_at: new Date().toISOString(),
          })
          .eq('id', paymentId)
          .select()
          .single()

        if (updateError) {
          console.error('[v0] Error rejecting payment:', updateError)
          return NextResponse.json(
            { error: 'Failed to reject payment' },
            { status: 500 }
          )
        }

        console.log(`[v0] Payment rejected: ${paymentId}`)

        return NextResponse.json({
          success: true,
          message: `Payment rejected - ${reason || 'Invalid screenshot'}`,
          paymentId,
          status: 'rejected',
        })
      }
    }

    // CASE 2: Job Payment Approval
    // Step 1: Get current job state
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('[v0] Job not found:', jobError)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    console.log(`[v0] Admin ${adminId} ${action}ing payment for job: ${jobId}`)

    const oldJobState = {
      status: job.status,
      payment_status: job.payment_status,
      is_visible: job.is_visible,
      is_live: job.is_live,
    }

    if (action === 'approve') {
      // Update job: approve payment, make it live for customers
      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'LIVE',
          payment_status: 'approved',
          is_visible: true,
          is_live: true,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          visibility: 'public',
        })
        .eq('id', jobId)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Error approving payment:', updateError)

        // Log failed sync
        await logSync({
          entity_type: 'job',
          entity_id: jobId,
          action: 'approve',
          source: 'payments/approve/POST',
          old_data: oldJobState,
          new_data: { status: 'LIVE', payment_status: 'approved' },
          status: 'failed',
          error_message: updateError.message,
        })

        return NextResponse.json(
          { error: 'Failed to approve payment' },
          { status: 500 }
        )
      }

      // Log successful approval
      await logSync({
        entity_type: 'job',
        entity_id: jobId,
        action: 'approve',
        source: 'payments/approve/POST',
        old_data: oldJobState,
        new_data: {
          status: 'LIVE',
          payment_status: 'approved',
          is_visible: true,
          is_live: true,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        },
        status: 'success',
      })

      // Verify consistency
      const consistency = await verifyDataConsistency(jobId)

      console.log(`[v0] Payment approved for job ${jobId}, job is now LIVE`)

      return NextResponse.json({
        success: true,
        message: 'Payment approved successfully - job is now live',
        jobId,
        status: 'approved',
        jobStatus: 'LIVE',
        isVisible: true,
        isLive: true,
        consistent: consistency.consistent,
      })
    } else {
      // Reject: Mark payment as rejected, job goes back to draft
      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'DRAFT',
          payment_status: 'rejected',
          is_visible: false,
          is_live: false,
          rejection_reason: reason || 'Payment rejected by admin',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          visibility: 'private',
        })
        .eq('id', jobId)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Error rejecting payment:', updateError)

        // Log failed sync
        await logSync({
          entity_type: 'job',
          entity_id: jobId,
          action: 'reject',
          source: 'payments/approve/POST',
          old_data: oldJobState,
          new_data: { status: 'DRAFT', payment_status: 'rejected' },
          status: 'failed',
          error_message: updateError.message,
        })

        return NextResponse.json(
          { error: 'Failed to reject payment' },
          { status: 500 }
        )
      }

      // Log successful rejection
      await logSync({
        entity_type: 'job',
        entity_id: jobId,
        action: 'reject',
        source: 'payments/approve/POST',
        old_data: oldJobState,
        new_data: {
          status: 'DRAFT',
          payment_status: 'rejected',
          is_visible: false,
          is_live: false,
          rejection_reason: reason || 'Payment rejected by admin',
        },
        status: 'success',
      })

      // Verify consistency
      const consistency = await verifyDataConsistency(jobId)

      console.log(`[v0] Payment rejected for job ${jobId}`)

      return NextResponse.json({
        success: true,
        message: `Payment rejected - ${reason || 'Please resubmit payment'}`,
        jobId,
        status: 'rejected',
        consistent: consistency.consistent,
      })
    }
  } catch (error) {
    console.error('[v0] Error in payment approval:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}


