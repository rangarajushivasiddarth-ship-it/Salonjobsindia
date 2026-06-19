import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Job from '@/server/src/models/Job'
import { getPendingJobs } from '@/lib/adapters/dual-read-adapter'

// GET - Fetch all jobs with pending payment approvals for admin dashboard (DUAL-READ: Supabase primary)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    console.log('[v0] [Admin Pending] Fetching pending payments with dual-read')

    // Use dual-read adapter: queries Supabase first, falls back to MongoDB
    const dualReadResult = await getPendingJobs(100)
    
    console.log('[v0] [Admin Pending] Data source: ' + dualReadResult.source + ', found: ' + dualReadResult.data.length + ', duration: ' + dualReadResult.duration + 'ms')

    // Map to admin-friendly format
    const pendingJobPayments = dualReadResult.data.map((job: any) => ({
      id: job.id || job._id?.toString() || job._id,
      jobId: job.id || job._id?.toString() || job._id,
      ownerId: job.owner_id || job.ownerId || '',
      salonName: job.salon_name || job.salonName,
      ownerName: 'Unknown',
      ownerPhone: '',
      ownerEmail: '',
      jobTitle: job.title,
      jobDetails: {
        description: job.description,
        skills: job.skills || [],
        salary: { min: job.salary_min, max: job.salary_max }
      },
      planName: job.payment_plan || job.paymentPlan || 'Standard',
      planPrice: job.payment_amount || job.paymentAmount || 0,
      screenshotUrl: job.payment_screenshot_url || job.paymentScreenshotUrl,
      status: 'pending',
      createdAt: job.payment_submitted_at || job.paymentSubmittedAt || new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: pendingJobPayments,
      count: pendingJobPayments.length,
      source: dualReadResult.source,
      duration: dualReadResult.duration,
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
