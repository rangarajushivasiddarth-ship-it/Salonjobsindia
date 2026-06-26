import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', params.paymentId)
      .single()

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: payment.status,
      razorpayPaymentId: payment.razorpay_payment_id,
      paidAt: payment.paid_at,
      amount: payment.amount,
      type: payment.type,
    })
  } catch (error) {
    console.error('[v0] Error fetching payment status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
