import { type NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Payment from '@/server/src/models/Payment'
import Job from '@/server/src/models/Job'
import User from '@/server/src/models/User'

// GET - Retrieve all pending items (for admin polling)
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const userId = request.nextUrl.searchParams.get('userId')

  console.log(`[Sync API] GET request - type: ${type}, userId: ${userId}`)

  try {
    await connectDB()
    
    if (type === 'pending-subscriptions') {
      const payments = await Payment.find({
        type: 'job_seeker_subscription',
        status: 'pending'
      })
        .populate('userId', 'name email phone')
        .lean()

      console.log(`[Sync API] Returning ${payments.length} pending subscriptions`)
      return NextResponse.json({ success: true, data: payments, timestamp: Date.now() })
    }

    if (type === 'pending-job-payments') {
      const payments = await Payment.find({
        type: 'job_publishing',
        status: 'pending'
      })
        .populate('userId', 'name email phone')
        .lean()

      console.log(`[Sync API] Returning ${payments.length} pending job payments`)
      return NextResponse.json({ success: true, data: payments, timestamp: Date.now() })
    }

    if (type === 'check-approval' && userId) {
      const payment = await Payment.findOne({
        userId,
        status: 'approved'
      })
        .sort({ approvedAt: -1 })
        .lean()

      console.log(`[Sync API] Checking approval for user ${userId}: ${payment ? 'APPROVED' : 'NOT FOUND'}`)
      return NextResponse.json({
        success: true,
        approved: !!payment,
        data: payment || null,
        timestamp: Date.now()
      })
    }

    if (type === 'all-pending') {
      const [pendingSubs, pendingJobs] = await Promise.all([
        Payment.find({
          type: 'job_seeker_subscription',
          status: 'pending'
        })
          .populate('userId', 'name email phone')
          .lean(),
        Payment.find({
          type: 'job_publishing',
          status: 'pending'
        })
          .populate('userId', 'name email phone')
          .lean()
      ])

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
      const jobs = await Job.find({ status: 'active' })
        .sort({ postedAt: -1 })
        .lean()

      console.log(`[Sync API] Returning ${jobs.length} approved jobs`)
      return NextResponse.json({ success: true, data: jobs, timestamp: Date.now() })
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

    await connectDB()

    if (type === 'subscription') {
      const payment = new Payment({
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        type: 'job_seeker_subscription',
        amount: data.planPrice,
        currency: 'INR',
        paymentMethod: 'screenshot',
        screenshotUrl: data.screenshotUrl,
        planId: data.planId,
        planName: data.planName,
        status: 'pending',
        metadata: { ...data }
      })

      await payment.save()

      console.log(`[Sync API] Subscription payment submitted: ${payment._id}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription payment submitted',
        paymentId: payment._id 
      })
    }

    if (type === 'job-payment') {
      // First, create the job in database
      const job = new Job({
        ownerId: data.salonId,
        title: data.jobTitle,
        description: data.jobDetails?.description || 'Job posting',
        salonName: data.salonName,
        jobType: data.jobDetails?.jobType || 'full-time',
        skills: data.jobDetails?.skills || [],
        experienceRequired: data.jobDetails?.experience || 0,
        salary: {
          min: 0,
          max: 0,
          currency: 'INR',
          period: 'monthly'
        },
        location: {
          type: 'Point',
          coordinates: [data.jobDetails?.location?.lng || 0, data.jobDetails?.location?.lat || 0],
          address: data.jobDetails?.location?.address || '',
          city: data.jobDetails?.location?.city || '',
          state: data.jobDetails?.location?.state || ''
        },
        requirements: [],
        benefits: [],
        status: 'draft',
        paymentStatus: 'pending_approval',
        visibility: 'private',
        isLive: false,
        postedAt: new Date()
      })

      await job.save()

      // Then create the payment linked to the job
      const payment = new Payment({
        userId: data.salonId,
        userName: data.ownerName,
        userEmail: data.ownerEmail,
        userPhone: data.ownerPhone,
        type: 'job_publishing',
        amount: data.planPrice,
        currency: 'INR',
        paymentMethod: 'screenshot',
        screenshotUrl: data.screenshotUrl,
        jobId: job._id,
        planId: data.planId,
        planName: data.planName,
        status: 'pending',
        metadata: { salonName: data.salonName, jobTitle: data.jobTitle }
      })

      await payment.save()

      // Link payment to job
      job.paymentId = payment._id
      await job.save()
      
      console.log(`[Sync API] Job payment submitted: ${payment._id} for job: ${job._id}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Job payment submitted',
        paymentId: payment._id,
        jobId: job._id
      })
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

    await connectDB()

    if (type === 'subscription') {
      const payment = await Payment.findById(id)

      if (!payment) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }

      const updatedStatus = action === 'approve' ? 'approved' : 'rejected'
      payment.status = updatedStatus
      payment.approvedAt = new Date()
      payment.approvedBy = adminId

      await payment.save()

      console.log(`[Sync API] Subscription payment ${action}d: ${id}`)

      return NextResponse.json({
        success: true,
        message: `Subscription ${action}d`,
        payment: payment.toObject()
      })
    }

    if (type === 'job-payment') {
      const payment = await Payment.findById(id)

      if (!payment) {
        return NextResponse.json({ error: 'Job payment not found' }, { status: 404 })
      }

      const updatedStatus = action === 'approve' ? 'approved' : 'rejected'
      payment.status = updatedStatus
      payment.approvedAt = new Date()
      payment.approvedBy = adminId

      await payment.save()

      // If approved, mark the job as active if it exists
      if (action === 'approve' && payment.jobId) {
        try {
          const job = await Job.findById(payment.jobId)
          if (job) {
            job.status = 'active'
            job.postedAt = new Date()
            await job.save()
            console.log(`[Sync API] Job ${payment.jobId} approved and set to active`)
          }
        } catch (jobError) {
          console.error('Error updating job:', jobError)
        }
      }

      console.log(`[Sync API] Job payment ${action}d: ${id}`)

      return NextResponse.json({
        success: true,
        message: `Job payment ${action}d`,
        payment: payment.toObject()
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
