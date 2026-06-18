import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Payment from '@/server/src/models/Payment'
import Job from '@/server/src/models/Job'

// GET - Fetch payments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const type = searchParams.get('type') // job_publishing, contact_pack, job_seeker_subscription
    
    await connectDB()
    
    const query: Record<string, unknown> = { status }
    if (type) query.type = type
    
    const payments = await Payment.find(query)
      .populate('userId', 'name email phone')
      .populate('jobId', 'title salonName')
      .sort({ createdAt: -1 })
      .lean()
    
    console.log(`[v0] Fetched ${payments.length} payments with status: ${status}`)
    
    return NextResponse.json({
      success: true,
      data: payments,
      count: payments.length
    })
  } catch (error) {
    console.error('[v0] Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create payment record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      userName,
      userEmail,
      userPhone,
      type, 
      jobId, 
      amount, 
      screenshotUrl,
      salonName,
      ownerName
    } = body
    
    // Validate required fields
    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      )
    }

    // Job publishing payment requires jobId
    if (type === 'job_publishing' && !jobId) {
      return NextResponse.json(
        { error: 'jobId required for job_publishing payment' },
        { status: 400 }
      )
    }
    
    await connectDB()

    // Create payment record
    const payment = new Payment({
      userId,
      userName: ownerName || userName,
      userEmail,
      userPhone,
      type,
      amount,
      currency: 'INR',
      paymentMethod: 'screenshot',
      screenshotUrl,
      jobId: type === 'job_publishing' ? jobId : undefined,
      status: 'pending',
      metadata: { salonName }
    })

    await payment.save()

    // If job publishing payment, update job with payment reference
    if (type === 'job_publishing' && jobId) {
      await Job.findByIdAndUpdate(
        jobId,
        {
          paymentStatus: 'pending_approval',
          paymentId: payment._id,
          visibility: 'private',
          isLive: false
        },
        { new: true }
      )
    }
    
    console.log(`[v0] Payment created: ${payment._id} for ${type}`)
    
    return NextResponse.json({
      success: true,
      paymentId: payment._id,
      message: 'Payment record created',
      status: 'pending'
    })
  } catch (error) {
    console.error('[v0] Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


