import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay credentials in environment variables')
}

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, amount, planName, durationMonths } = await request.json()

    if (!userId || !planId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, planId, amount' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating subscription order:', { userId, planId, amount })

    // Create Razorpay order
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `sub_${userId}_${Date.now()}`,
        notes: {
          userId,
          planId,
          planName,
          durationMonths: durationMonths || 1,
          type: 'subscription',
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
    console.log('[v0] Razorpay order created:', razorpayOrder.id)

    // Store in database
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'subscription',
        plan_id: planId,
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

    console.log('[v0] Payment record stored:', payment.id)

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('[v0] Subscription order creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
