import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Payment from '@/server/src/models/Payment'
import Job from '@/server/src/models/Job'
import mongoose from 'mongoose'

// POST - Admin approve or reject payment
export async function POST(request: NextRequest) {
  let session: mongoose.ClientSession | null = null
  
  try {
    const body = await request.json()
    const { paymentId, action, reason, adminId } = body
    
    if (!paymentId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, action, adminId' },
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

    // Get payment
    const payment = await Payment.findById(paymentId).session(session)

    if (!payment) {
      await session.abortTransaction()
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log(`[v0] Admin ${adminId} ${action}ing payment: ${paymentId}`)

    if (action === 'approve') {
      // Update payment status
      payment.status = 'approved'
      payment.approvedBy = new mongoose.Types.ObjectId(adminId)
      payment.approvedAt = new Date()
      await payment.save({ session })

      // If job publishing payment, make job live
      if (payment.type === 'job_publishing' && payment.jobId) {
        const job = await Job.findByIdAndUpdate(
          payment.jobId,
          {
            paymentStatus: 'approved',
            visibility: 'public',
            isLive: true,
            approvedBy: new mongoose.Types.ObjectId(adminId),
            approvedAt: new Date(),
            status: 'active'
          },
          { new: true, session }
        )

        if (!job) {
          await session.abortTransaction()
          console.error('[v0] Job not found when approving payment:', payment.jobId)
          return NextResponse.json(
            { error: 'Payment approved but associated job not found' },
            { status: 500 }
          )
        }

        console.log('[v0] Job made live after payment approval:', payment.jobId)
      }

      await session.commitTransaction()
      
      return NextResponse.json({
        success: true,
        message: `Payment approved successfully${payment.jobId ? ' - Job is now live' : ''}`,
        paymentId
      })
    } else {
      // Reject payment
      payment.status = 'rejected'
      payment.approvedBy = new mongoose.Types.ObjectId(adminId)
      payment.rejectionReason = reason || 'No reason provided'
      await payment.save({ session })

      // If job publishing payment, revert job
      if (payment.type === 'job_publishing' && payment.jobId) {
        await Job.findByIdAndUpdate(
          payment.jobId,
          {
            paymentStatus: 'rejected',
            visibility: 'private',
            isLive: false,
            status: 'draft'
          },
          { new: true, session }
        )

        console.log('[v0] Job reverted to draft after payment rejection:', payment.jobId)
      }

      await session.commitTransaction()
      
      return NextResponse.json({
        success: true,
        message: 'Payment rejected successfully',
        paymentId
      })
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction()
    }
    console.error('[v0] Error in payment approval:', error)
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


