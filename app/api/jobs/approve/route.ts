import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Job from '@/server/src/models/Job'
import mongoose from 'mongoose'

// POST - Atomic approval: approve payment AND make job live
export async function POST(request: NextRequest) {
  let session: mongoose.ClientSession | null = null

  try {
    const body = await request.json()
    const { jobId, adminId, action, rejectionReason } = body

    if (!jobId || !adminId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, adminId, action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    await connectDB()

    // Start session for atomic transaction
    session = await mongoose.startSession()
    session.startTransaction()

    // Get job
    const job = await Job.findById(jobId).session(session)

    if (!job) {
      await session.abortTransaction()
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify job is in PAYMENT_PENDING status
    console.log(`[v0] Job status before approval: ${job.status}, paymentStatus: ${job.paymentStatus}`)
    
    if (job.status !== 'PAYMENT_PENDING') {
      await session.abortTransaction()
      console.error(`[v0] Job not in PAYMENT_PENDING, actual: ${job.status}`)
      return NextResponse.json(
        { error: `Job is not in PAYMENT_PENDING status, actual: ${job.status}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      console.log(`[v0] Approving job ${jobId} - updating status PAYMENT_PENDING → LIVE`)
      
      // Atomic approval: transition job from PAYMENT_PENDING → APPROVED → LIVE
      // All updates happen in single transaction (all-or-nothing)
      const updatedJob = await Job.findByIdAndUpdate(
        jobId,
        {
          status: 'LIVE',
          paymentStatus: 'approved',
          visibility: 'public',
          isLive: true,
          isVisible: true,
          approvedBy: new mongoose.Types.ObjectId(adminId),
          approvedAt: new Date(),
          // Set expiration to 30 days from now (can be configurable per plan)
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        { session, new: true }
      )

      console.log(`[v0] Job updated, new status: ${updatedJob?.status}, paymentStatus: ${updatedJob?.paymentStatus}`)

      await session.commitTransaction()

      console.log(`[v0] Job approved and made live: ${jobId}`)

      return NextResponse.json({
        success: true,
        message: 'Job approved and is now live. Job seekers can see it immediately.',
        jobId,
        newStatus: 'LIVE'
      })
    } else {
      // Rejection: revert to DRAFT
      await Job.findByIdAndUpdate(
        jobId,
        {
          status: 'DRAFT',
          paymentStatus: 'rejected',
          visibility: 'private',
          isLive: false,
          isVisible: false,
          rejectionReason: rejectionReason || 'Payment rejected by admin'
        },
        { session, new: true }
      )

      await session.commitTransaction()

      console.log(`[v0] Job payment rejected: ${jobId}`)

      return NextResponse.json({
        success: true,
        message: 'Job payment rejected. Returned to draft status.',
        jobId,
        newStatus: 'DRAFT'
      })
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction()
    }
    console.error('[v0] Error approving job:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  } finally {
    if (session) {
      await session.endSession()
    }
  }
}
