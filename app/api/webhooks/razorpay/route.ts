import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

if (!RAZORPAY_WEBHOOK_SECRET) {
  throw new Error('Missing RAZORPAY_WEBHOOK_SECRET in environment variables')
}

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('[v0] Missing Razorpay signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify signature
    if (!verifySignature(body, signature)) {
      console.error('[v0] Invalid Razorpay signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('[v0] Webhook event received:', event.event)

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Handle payment.captured and order.paid events
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const { payment, order } = event.payload

      if (!order || !order.entity) {
        console.error('[v0] Missing order in webhook payload')
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }

      const orderId = order.entity.id
      const paymentId = payment?.entity?.id
      const notes = order.entity.notes || {}
      const paymentType = notes.type

      console.log('[v0] Processing payment for order:', orderId, 'type:', paymentType)

      // Find the payment record
      const { data: paymentRecord, error: findError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single()

      if (findError || !paymentRecord) {
        console.error('[v0] Payment record not found:', orderId)
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.id)

      if (updateError) {
        console.error('[v0] Error updating payment:', updateError)
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
      }

      console.log('[v0] Payment updated to paid:', paymentRecord.id)

      // Handle subscription activation
      if (paymentType === 'subscription') {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30-day subscription

        const { error: subsError } = await supabase
          .from('salon_subscriptions')
          .upsert({
            user_id: paymentRecord.user_id,
            subscription_status: 'active',
            subscription_expiry: expiresAt.toISOString(),
            verification_badge: true,
            last_payment_id: paymentRecord.id,
            updated_at: new Date().toISOString(),
          })

        if (subsError) {
          console.error('[v0] Error updating subscription:', subsError)
        } else {
          console.log('[v0] Subscription activated for user:', paymentRecord.user_id)
        }
      }

      // Handle job posting payment
      if (paymentType === 'job_posting' && paymentRecord.job_id) {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({
            status: 'live',
            is_live: true,
            is_visible: true,
            payment_status: 'paid',
          })
          .eq('id', paymentRecord.job_id)

        if (jobError) {
          console.error('[v0] Error updating job:', jobError)
        } else {
          console.log('[v0] Job activated and set live:', paymentRecord.job_id)
        }
      }

      return NextResponse.json({ success: true })
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const { payment, order } = event.payload

      if (!order || !order.entity) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }

      const orderId = order.entity.id

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          razorpay_payment_id: payment?.entity?.id,
        })
        .eq('razorpay_order_id', orderId)

      if (!updateError) {
        console.log('[v0] Payment marked as failed:', orderId)
      }

      return NextResponse.json({ success: true })
    }

    console.log('[v0] Unhandled webhook event:', event.event)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
