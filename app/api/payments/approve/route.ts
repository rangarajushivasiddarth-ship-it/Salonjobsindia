import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, PaymentDocument, ObjectId } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-middleware'
import { validateInput, approvePaymentSchema } from '@/lib/input-validation'

// POST - Admin approve or reject payment
// SECURITY: Requires admin authentication
export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX #1: Verify admin authentication
    const authResult = await requireAuth(request, 'admin')
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    
    // SECURITY FIX #2: Validate input with schema
    const validation = validateInput(approvePaymentSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    const { paymentId, action, reason } = validation.data
    const adminId = authResult.auth.userId

    const db = await connectToDatabase()
    const paymentsCollection = db.collection<PaymentDocument>('payments')
    const jobsCollection = db.collection('jobs')

    // Get payment
    const payment = await paymentsCollection.findOne({ _id: new ObjectId(paymentId) })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log(`[v0] Admin ${adminId} ${action}ing payment: ${paymentId}`)

    if (action === 'approve') {
      // Update payment status
      await paymentsCollection.updateOne(
        { _id: new ObjectId(paymentId) },
        {
          $set: {
            status: 'approved',
            processedAt: new Date(),
            processedBy: adminId,
            updatedAt: new Date()
          }
        }
      )

      // If job publishing payment, make job live and SET PAYMENT ID
      if (payment.type === 'job_publishing' && payment.jobId) {
        const updateResult = await jobsCollection.updateOne(
          { _id: new ObjectId(payment.jobId) },
          {
            $set: {
              status: 'live', // SINGLE source of truth
              isActive: true,
              paymentId: paymentId, // CRITICAL: Set paymentId when approving payment
              paymentApprovedAt: new Date(),
              // Calculate expiration date based on validity
              expiresAt: new Date(
                Date.now() + (payment.validityDays || 30) * 24 * 60 * 60 * 1000
              ),
              updatedAt: new Date()
            }
          }
        )

        if (updateResult.matchedCount === 0) {
          console.error('[v0] Job not found when approving payment:', payment.jobId)
          // Log to dead letter queue for manual review
          return NextResponse.json(
            {
              success: false,
              error: 'Payment approved but associated job not found. Please contact support.'
            },
            { status: 500 }
          )
        }

        console.log('[v0] Job made live after payment approval:', payment.jobId)
      }

      // TODO: Add to audit log collection
      // const auditCollection = db.collection('audit_logs')
      // await auditCollection.insertOne({
      //   action: 'payment_approved',
      //   paymentId,
      //   adminId,
      //   timestamp: new Date(),
      //   details: payment
      // })

      return NextResponse.json({
        success: true,
        message: `Payment approved successfully${payment.jobId ? ' - Job is now live' : ''}`,
        paymentId
      })
    } else {
      // Reject payment
      await paymentsCollection.updateOne(
        { _id: new ObjectId(paymentId) },
        {
          $set: {
            status: 'rejected',
            processedAt: new Date(),
            processedBy: adminId,
            rejectionReason: reason || 'No reason provided',
            updatedAt: new Date()
          }
        }
      )

      // If job publishing payment, revert job to draft
      if (payment.type === 'job_publishing' && payment.jobId) {
        await jobsCollection.updateOne(
          { _id: new ObjectId(payment.jobId) },
          {
            $set: {
              status: 'draft', // Back to draft, not live
              isActive: false,
              paymentId: '', // Clear payment ID
              updatedAt: new Date()
            }
          }
        )

        console.log('[v0] Job reverted to draft after payment rejection:', payment.jobId)
      }

      return NextResponse.json({
        success: true,
        message: 'Payment rejected successfully',
        paymentId
      })
    }
  } catch (error) {
    console.error('[v0] Error in payment approval:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}


