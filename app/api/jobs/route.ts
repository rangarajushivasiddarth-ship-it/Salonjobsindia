import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Job from '@/server/src/models/Job'
import { getLiveJobs } from '@/lib/adapters/dual-read-adapter'

// GET - Fetch approved/live jobs for job seekers (DUAL-READ: Supabase primary, MongoDB fallback)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const ownerId = searchParams.get('ownerId') || ''

    await connectDB()

    console.log('[v0] [Job Seeker] Querying live jobs with dual-read (page: ' + page + ', search: ' + search + ', city: ' + city + ')')

    // Use dual-read adapter: queries Supabase first, falls back to MongoDB
    const dualReadResult = await getLiveJobs(city, search, limit * 2)
    
    console.log('[v0] [Job Seeker] Data source: ' + dualReadResult.source + ', duration: ' + dualReadResult.duration + 'ms')

    let jobs = dualReadResult.data || []

    // Apply additional filters if needed
    if (ownerId) {
      jobs = jobs.filter(j => j.owner_id === ownerId || j.ownerId === ownerId)
    }

    // Apply pagination
    const totalCount = jobs.length
    jobs = jobs.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      success: true,
      data: jobs,
      source: dualReadResult.source,
      duration: dualReadResult.duration,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('[v0] Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new job in DRAFT status (payment required before going live)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      ownerId, 
      salonName, 
      title, 
      description = '',
      jobType = 'full-time',
      skills = [],
      experienceRequired = 0,
      salary = { min: 0, max: 0, currency: 'INR', period: 'monthly' },
      location = {},
      requirements = [],
      benefits = []
    } = body

    // Validate required fields
    if (!ownerId || !salonName || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: ownerId, salonName, title' },
        { status: 400 }
      )
    }

    // Validate location
    if (!location.lat || !location.lng || !location.address) {
      return NextResponse.json(
        { error: 'Invalid location: must include lat, lng, address' },
        { status: 400 }
      )
    }

    await connectDB()

    // Create job in DRAFT status (not visible to seekers yet)
    const job = new Job({
      ownerId,
      title,
      description,
      salonName,
      jobType,
      skills,
      experienceRequired,
      salary,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: location.address,
        city: location.city || '',
        state: location.state || ''
      },
      requirements,
      benefits,
      status: 'DRAFT', // Start in DRAFT
      paymentStatus: 'none',
      visibility: 'private',
      isLive: false,
      isVisible: false,
      postedAt: new Date()
    })

    await job.save()

    console.log('[v0] Job created in DRAFT status:', job._id)

    return NextResponse.json({
      success: true,
      jobId: job._id.toString(),
      status: 'DRAFT',
      message: 'Job saved as draft. Submit payment to publish and reach job seekers.'
    })

  } catch (error) {
    console.error('[v0] Error creating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Submit payment for job (transitions from DRAFT to PAYMENT_PENDING)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, screenshotUrl, amount, plan } = body

    if (!jobId || !screenshotUrl || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, screenshotUrl, amount' },
        { status: 400 }
      )
    }

    await connectDB()

    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        status: 'PAYMENT_PENDING',
        paymentStatus: 'pending',
        paymentScreenshotUrl: screenshotUrl,
        paymentAmount: amount,
        paymentPlan: plan,
        paymentSubmittedAt: new Date()
      },
      { new: true }
    )

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Job payment submitted:', jobId)

    return NextResponse.json({
      success: true,
      jobId: job._id,
      status: 'PAYMENT_PENDING',
      message: 'Payment submitted. Admin will review and approve within 24 hours.'
    })

  } catch (error) {
    console.error('[v0] Error submitting payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete job (only DRAFT jobs can be deleted)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const job = await Job.findById(jobId)
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete jobs in DRAFT status' },
        { status: 400 }
      )
    }

    await Job.findByIdAndDelete(jobId)

    console.log('[v0] Job deleted:', jobId)

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    })

  } catch (error) {
    console.error('[v0] Error deleting job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
