import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logSync, verifyDataConsistency } from '@/lib/sync-logs'

/**
 * GET - Fetch payments with filters (Admin view)
 * Only admins can view all payments via RLS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const type = searchParams.get('type')
    
    const supabase = await createClient()
    
    // Build query for payments
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        owner_id,
        payment_status,
        payment_amount,
        payment_screenshot_url,
        payment_submitted_at,
        created_at,
        users:owner_id(full_name, email, phone)
      `)
      .eq('payment_status', status)

    if (type) {
      query = query.eq('job_type', type)
    }

    const { data: payments, error } = await query
      .order('payment_submitted_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    console.log(`[v0] Fetched ${payments?.length || 0} payments with status: ${status}`)

    return NextResponse.json({
      success: true,
      data: payments || [],
      count: payments?.length || 0
    })
  } catch (error) {
    console.error('[v0] Error in GET payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create payment record when customer submits payment for credits/badge
 * Perfect sync: Payment immediately recorded in Supabase → Admin sees instantly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      jobId,
      userId,
      amount,
      screenshotUrl,
      type,
      planId,
      credits,
      validityDays,
      durationMonths,
    } = body

    // Validate required fields
    if (!userId || !amount || !screenshotUrl) {
      console.log('[v0] Payment validation failed:', { userId, amount, screenshotUrl })
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, screenshotUrl' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[v0] User not found:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If jobId provided, update job with payment. Otherwise, just create payment record for credits/badge
    if (jobId) {
      // Job-based payment (original flow)
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('owner_id', userId)
        .single()

      if (jobError) {
        console.error('[v0] Job not found:', jobError)
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      const oldJobState = {
        payment_status: job.payment_status,
        payment_screenshot_url: job.payment_screenshot_url,
        payment_submitted_at: job.payment_submitted_at,
      }

      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update({
          payment_status: 'pending',
          payment_amount: amount,
          payment_screenshot_url: screenshotUrl,
          payment_submitted_at: new Date().toISOString(),
          is_visible: false,
          is_live: false,
          status: 'PAYMENT_PENDING',
        })
        .eq('id', jobId)
        .eq('owner_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Error updating job with payment:', updateError)
        
        await logSync({
          entity_type: 'job',
          entity_id: jobId,
          action: 'update',
          source: 'payments/POST',
          old_data: oldJobState,
          new_data: { payment_status: 'pending' },
          status: 'failed',
          error_message: updateError.message,
        })

        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        )
      }

      await logSync({
        entity_type: 'job',
        entity_id: jobId,
        action: 'update',
        source: 'payments/POST',
        old_data: oldJobState,
        new_data: {
          payment_status: 'pending',
          payment_amount: amount,
          payment_screenshot_url: screenshotUrl,
          payment_submitted_at: new Date().toISOString(),
          status: 'PAYMENT_PENDING',
        },
        status: 'success',
      })

      const consistency = await verifyDataConsistency(jobId)
      
      console.log(`[v0] Payment submitted for job ${jobId}, consistency: ${consistency.consistent}`)

      return NextResponse.json({
        success: true,
        message: 'Payment submitted successfully',
        jobId,
        status: 'pending',
        consistent: consistency.consistent,
      })
    } else {
      // Credit/Badge payment (new flow)
      // Create payment record in payments table
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount,
          screenshot_url: screenshotUrl,
          type: type || 'contact_pack',
          plan_id: planId,
          contact_credits: credits || 0,
          validity_days: validityDays || 365,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (paymentError) {
        console.error('[v0] Error creating payment record:', paymentError)
        return NextResponse.json(
          { error: 'Failed to submit payment' },
          { status: 500 }
        )
      }

      console.log(`[v0] Payment created for user ${userId}, type: ${type}`)

      return NextResponse.json({
        success: true,
        message: 'Payment submitted successfully',
        paymentId: payment.id,
        status: 'pending',
      })
    }
  } catch (error) {
    console.error('[v0] Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}


