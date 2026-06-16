import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client only at runtime
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(url, key)
}

// GET - Retrieve all pending items (for admin polling)
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const userId = request.nextUrl.searchParams.get('userId')

  console.log(`[Sync API] GET request - type: ${type}, userId: ${userId}`)

  try {
    const supabase = getSupabaseClient()
    
    if (type === 'pending-subscriptions') {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'pending')

      if (error) throw error

      console.log(`[Sync API] Returning ${data?.length || 0} pending subscriptions`)
      return NextResponse.json({ success: true, data: data || [], timestamp: Date.now() })
    }

    if (type === 'pending-job-payments') {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .eq('type', 'job_publishing')

      if (error) throw error

      console.log(`[Sync API] Returning ${data?.length || 0} pending job payments`)
      return NextResponse.json({ success: true, data: data || [], timestamp: Date.now() })
    }

    if (type === 'check-approval' && userId) {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'approved')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      console.log(`[Sync API] Checking approval for user ${userId}: ${subscription ? 'APPROVED' : 'NOT FOUND'}`)
      return NextResponse.json({
        success: true,
        approved: !!subscription,
        data: subscription || null,
        timestamp: Date.now()
      })
    }

    if (type === 'all-pending') {
      const [subscriptions, jobPayments] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('status', 'pending'),
        supabase
          .from('payments')
          .select('*')
          .eq('status', 'pending')
          .eq('type', 'job_publishing')
      ])

      const pendingSubs = subscriptions.data || []
      const pendingJobs = jobPayments.data || []

      console.log(`[Sync API] All pending - subs: ${pendingSubs.length}, jobs: ${pendingJobs.length}`)

      return NextResponse.json({
        success: true,
        pendingSubscriptions: pendingSubs,
        pendingJobPayments: pendingJobs,
        totalPending: pendingSubs.length + pendingJobs.length,
        timestamp: Date.now()
      })
    }

    if (type === 'approved-jobs') {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'live')
        .order('createdAt', { ascending: false })

      if (error) throw error

      console.log(`[Sync API] Returning ${data?.length || 0} approved jobs`)
      return NextResponse.json({ success: true, data: data || [], timestamp: Date.now() })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST - Submit new pending item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`[Sync API] POST request - type: ${type}`, data)

    const supabase = getSupabaseClient()

    if (type === 'subscription') {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })

      if (error) throw error

      console.log(`[Sync API] Subscription payment submitted: ${data.id}`)
      return NextResponse.json({ success: true, message: 'Subscription payment submitted' })
    }

    if (type === 'job-payment') {
      const { error } = await supabase
        .from('payments')
        .upsert({
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })

      if (error) throw error

      console.log(`[Sync API] Job payment submitted: ${data.id}`)
      return NextResponse.json({ success: true, message: 'Job payment submitted' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] POST error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}

// PUT - Approve/Reject pending item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, action, adminId } = body

    console.log(`[Sync API] PUT request - type: ${type}, id: ${id}, action: ${action}`)

    const supabase = getSupabaseClient()

    if (type === 'subscription') {
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (!subscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }

      const updatedStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: updatedStatus,
          approvedAt: new Date().toISOString(),
          processedBy: adminId
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update user subscription status if approved
      if (action === 'approve') {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (subscription.planDuration || 30))

        const { error: userError } = await supabase
          .from('job_seekers')
          .update({
            isSubscribed: true,
            subscriptionExpiresAt: expiresAt.toISOString()
          })
          .eq('id', subscription.userId)

        if (userError) console.error('Error updating user subscription:', userError)

        console.log(`[Sync API] User ${subscription.userId} approved for subscription`)
      }

      return NextResponse.json({
        success: true,
        message: `Subscription ${action}d`,
        subscription
      })
    }

    if (type === 'job-payment') {
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (!payment) {
        return NextResponse.json({ error: 'Job payment not found' }, { status: 404 })
      }

      const updatedStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: updatedStatus,
          approvedAt: new Date().toISOString(),
          processedBy: adminId
        })
        .eq('id', id)

      if (updateError) throw updateError

      // If approved, create the job
      if (action === 'approve' && payment.jobId) {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({
            status: 'live',
            isActive: true,
            approvedAt: new Date().toISOString(),
            paymentId: payment.id
          })
          .eq('id', payment.jobId)

        if (jobError) console.error('Error updating job:', jobError)

        console.log(`[Sync API] Job ${payment.jobId} approved and set to live`)
      }

      return NextResponse.json({
        success: true,
        message: `Job payment ${action}d`,
        payment
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
