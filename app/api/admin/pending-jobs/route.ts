import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Job from '@/server/src/models/Job'

// GET - Fetch all jobs with pending payment approvals for admin dashboard
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Query for jobs in PAYMENT_PENDING status
    const pendingJobs = await Job.find({
      status: 'PAYMENT_PENDING',
      paymentStatus: 'pending'
    })
      .populate('ownerId', 'email phone name')
      .sort({ paymentSubmittedAt: -1 })
      .lean()

    // Map to admin-friendly format
    const pendingJobPayments = pendingJobs.map(job => ({
      id: job._id.toString(),
      jobId: job._id.toString(),
      ownerId: job.ownerId?._id?.toString() || '',
      salonName: job.salonName,
      ownerName: (job.ownerId as any)?.name || 'Unknown',
      ownerPhone: (job.ownerId as any)?.phone || '',
      ownerEmail: (job.ownerId as any)?.email || '',
      jobTitle: job.title,
      jobDetails: {
        description: job.description,
        skills: job.skills,
        salary: job.salary
      },
      planName: job.paymentPlan || 'Standard',
      planPrice: job.paymentAmount || 0,
      screenshotUrl: job.paymentScreenshotUrl,
      status: 'pending',
      createdAt: job.paymentSubmittedAt?.toISOString() || job.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: pendingJobPayments,
      count: pendingJobPayments.length,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('[v0] Error fetching pending jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
