import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPendingJobs } from '@/lib/db/jobs'

// GET - Fetch all jobs with pending payment approvals for admin dashboard
export async function GET(request: NextRequest) {
  try {
    // Verify Supabase auth (user must be logged in)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[v0] [Admin Pending] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[v0] [Admin Pending] User', user.email, 'fetching pending payments from Supabase')

    // Call getPendingJobs to get jobs where status='PAYMENT_PENDING' AND payment_status='pending'
    const result = await getPendingJobs()
    
    if (!result.success) {
      console.error('[v0] [Admin Pending] Error fetching jobs:', result.error)
      return NextResponse.json({ error: 'Failed to fetch pending jobs' }, { status: 500 })
    }

    console.log('[v0] [Admin Pending] Found ' + result.data.length + ' pending jobs', result.data)

    // Map to admin-friendly format with ALL required fields
    const pendingJobPayments = result.data.map((job: any) => ({
      id: job.id,
      jobId: job.id,
      ownerId: job.owner_id,
      salonName: job.salon_name || 'Unknown Salon',
      ownerName: 'Salon Owner',
      ownerPhone: job.owner_phone || '',
      ownerEmail: job.owner_email || '',
      jobTitle: job.title,
      jobDescription: job.description || '',
      jobDetails: {
        description: job.description || '',
        skills: job.skills || [],
        salary: { 
          min: job.salary_min || 0, 
          max: job.salary_max || 0,
          currency: job.salary_currency || 'INR',
          period: job.salary_period || 'monthly'
        },
        location: {
          address: job.location_address || '',
          city: job.location_city || '',
          state: job.location_state || ''
        }
      },
      planName: job.payment_plan || 'Standard',
      planPrice: job.payment_amount || 0,
      screenshotUrl: job.payment_screenshot_url || '',
      paymentStatus: job.payment_status,
      jobStatus: job.status,
      status: 'pending',
      submittedAt: job.payment_submitted_at || job.created_at || new Date().toISOString(),
      createdAt: job.created_at || new Date().toISOString()
    }))

    console.log('[v0] [Admin Pending] Mapped', pendingJobPayments.length, 'pending jobs for admin view')

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
