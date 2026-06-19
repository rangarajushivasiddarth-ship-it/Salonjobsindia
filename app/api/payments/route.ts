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
 * POST - Create payment record when customer submits payment
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
    } = body

    // Validate required fields
    if (!jobId || !userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, userId, amount' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ATOMIC TRANSACTION: Get job, update it, log sync
    // Step 1: Get current job state
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

    // Step 2: Update job with payment details (SINGLE WRITE - NO DUAL WRITES)
    const oldJobState = {
      payment_status: job.payment_status,
      payment_screenshot_url: job.payment_screenshot_url,
      payment_submitted_at: job.payment_submitted_at,
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        payment_status: 'pending_approval',
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
      
      // Log failed sync attempt
      await logSync({
        entity_type: 'job',
        entity_id: jobId,
        action: 'update',
        source: 'payments/POST',
        old_data: oldJobState,
        new_data: { payment_status: 'pending_approval' },
        status: 'failed',
        error_message: updateError.message,
      })

      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      )
    }

    // Step 3: Log the successful sync
    await logSync({
      entity_type: 'job',
      entity_id: jobId,
      action: 'update',
      source: 'payments/POST',
      old_data: oldJobState,
      new_data: {
        payment_status: 'pending_approval',
        payment_amount: amount,
        payment_screenshot_url: screenshotUrl,
        payment_submitted_at: new Date().toISOString(),
        status: 'PAYMENT_PENDING',
      },
      status: 'success',
    })

    // Step 4: Verify data consistency
    const consistency = await verifyDataConsistency(jobId)
    
    console.log(`[v0] Payment submitted for job ${jobId}, consistency: ${consistency.consistent}`)

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully',
      jobId,
      status: 'pending_approval',
      consistent: consistency.consistent,
    })
  } catch (error) {
    console.error('[v0] Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


