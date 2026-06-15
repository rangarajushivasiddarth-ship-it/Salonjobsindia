import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, PaymentDocument, ObjectId } from '@/lib/mongodb'

// POST - Admin approve or reject payment
// IMPORTANT: Add authentication and authorization middleware before using in production
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, action, adminId, reason } = body
    
    if (!paymentId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
    
    // TODO: Add authentication middleware
    // if (!request.user || request.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const db = await connectToDatabase()
    const client = db.getClient?.() // Get client for transactions
    
    // Get payment
    const paymentsCollection = db.collection<PaymentDocument>('payments')
    const payment = await paymentsCollection.findOne({ _id: new ObjectId(paymentId) })
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    console.log(`[v0] Admin ${action}ing payment: ${paymentId}`)
    
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
        const jobsCollection = db.collection('jobs')
        
        // FIX: Make sure paymentId is set on job
        const updateResult = await jobsCollection.updateOne(
          { _id: new ObjectId(payment.jobId) },
          {
            $set: {
              status: 'live', // SINGLE source of truth
              isActive: true,
              paymentId: paymentId, // FIX: Set paymentId when approving payment
              paymentApprovedAt: new Date(),
              // Calculate expiration date based on validity
              expiresAt: new Date(Date.now() + (payment.validityDays || 30) * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            }
          }
        )
        
        if (updateResult.matchedCount === 0) {
          console.error('[v0] Job not found when approving payment:', payment.jobId)
          // Payment approved but job not found - add to dead letter queue
        }
        
        console.log('[v0] Job made live after payment approval:', payment.jobId)
      }
      
      // TODO: Add to audit log
      // await auditLogCollection.insertOne({
      //   action: 'payment_approved',
      //   paymentId,
      //   adminId,
      //   timestamp: new Date()
      // })
      
      return NextResponse.json({
        success: true,
        message: `Payment approved successfully${payment.jobId ? ' - Job is now live' : ''}`
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
            rejectionReason: reason,
            updatedAt: new Date()
          }
        }
      )
      
      // If job publishing payment, revert job to draft
      if (payment.type === 'job_publishing' && payment.jobId) {
        const jobsCollection = db.collection('jobs')
        await jobsCollection.updateOne(
          { _id: new ObjectId(payment.jobId) },
          {
            $set: {
              status: 'draft', // Back to draft, not live
              isActive: false,
              updatedAt: new Date()
            }
          }
        )
        
        console.log('[v0] Job reverted to draft after payment rejection:', payment.jobId)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Payment rejected successfully'
      })
    }
  } catch (error) {
    console.error('[v0] Error in payment approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

