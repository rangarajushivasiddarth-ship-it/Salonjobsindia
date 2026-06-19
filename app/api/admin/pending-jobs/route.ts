import { NextRequest, NextResponse } from 'next/server'
import { getPendingJobs } from '@/lib/db/jobs'

// GET - Fetch all jobs with pending payment approvals for admin dashboard
export async function GET(request: NextRequest) {
  try {
    console.log('[v0] [Admin Pending] Fetching pending payments from Supabase')

    const result = await getPendingJobs()
    
    if (!result.success) {
      console.error('[v0] [Admin Pending] Error fetching jobs:', result.error)
      return NextResponse.json({ error: 'Failed to fetch pending jobs' }, { status: 500 })
    }

    console.log('[v0] [Admin Pending] Found ' + result.data.length + ' pending jobs')

    // Map to admin-friendly format
    const pendingJobPayments = result.data.map((job: any) => ({
      id: job.id,
      jobId: job.id,
      ownerId: job.owner_id,
      salonName: job.salon_name,
      ownerName: 'Unknown',
      ownerPhone: '',
      ownerEmail: '',
      jobTitle: job.title,
      jobDetails: {
        description: job.description,
        skills: job.skills || [],
        salary: { min: job.salary_min, max: job.salary_max }
      },
      planName: job.payment_plan || 'Standard',
      planPrice: job.payment_amount || 0,
      screenshotUrl: job.payment_screenshot_url,
      status: 'pending',
      createdAt: job.payment_submitted_at || new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: pendingJobPayments,
      count: pendingJobPayments.length,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('[v0] [Admin Pending] Error fetching pending jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
