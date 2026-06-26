import { NextRequest, NextResponse } from 'next/server'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const JOB_POSTING_AMOUNT = 149 // Fixed amount in INR

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay credentials in environment variables')
}

export async function POST(request: NextRequest) {
  try {
    const { userId, jobId } = await request.json()

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, jobId' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating job posting order:', { userId, jobId, amount: JOB_POSTING_AMOUNT })

    // Check if user has active subscription
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: userSubs, error: subError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'subscription')
      .eq('status', 'paid')
      .gte('expires_at', new Date().toISOString())
      .limit(1)

    if (subError || !userSubs || userSubs.length === 0) {
      console.warn('[v0] User does not have active subscription:', userId)
      return NextResponse.json(
        { error: 'User must have an active subscription to post jobs' },
        { status: 403 }
      )
    }

    // Create Razorpay order
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: JOB_POSTING_AMOUNT * 100, // Convert to paise
        currency: 'INR',
        receipt: `job_${jobId}_${Date.now()}`,
        notes: {
          userId,
          jobId,
          type: 'job_posting',
        },
      }),
    })

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.text()
      console.error('[v0] Razorpay API error:', error)
      return NextResponse.json(
        { error: 'Failed to create Razorpay order' },
        { status: 500 }
      )
    }

    const razorpayOrder = await razorpayResponse.json()
    console.log('[v0] Razorpay job order created:', razorpayOrder.id)

    // Store payment record
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: JOB_POSTING_AMOUNT,
        type: 'job_posting',
        job_id: jobId,
        status: 'created',
        razorpay_order_id: razorpayOrder.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('[v0] Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to store payment record' },
        { status: 500 }
      )
    }

    console.log('[v0] Job payment record stored:', payment.id)

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: JOB_POSTING_AMOUNT,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('[v0] Job order creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
