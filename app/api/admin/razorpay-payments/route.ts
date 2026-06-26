import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'paid'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    let query = supabase
      .from('payments')
      .select(`
        id,
        user_id,
        amount,
        type,
        status,
        razorpay_payment_id,
        razorpay_order_id,
        paid_at,
        created_at,
        job_id
      `, { count: 'exact' })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[v0] Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      payments: payments || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('[v0] Admin payments API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, action } = await request.json()

    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'Missing jobId or action' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    if (action === 'reject') {
      // Remove fake job
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      return NextResponse.json({ success: true, message: 'Job removed' })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Admin action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
