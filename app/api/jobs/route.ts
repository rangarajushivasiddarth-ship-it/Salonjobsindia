import { NextRequest, NextResponse } from 'next/server'
import { getLiveJobs } from '@/lib/db/jobs'

// GET - Fetch approved/live jobs for job seekers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const ownerId = searchParams.get('ownerId') || ''

    console.log('[v0] [Jobs API] Fetching live jobs - page: ' + page + ', search: ' + search + ', city: ' + city)

    // Fetch live jobs from Supabase
    const result = await getLiveJobs(city, search)
    
    if (!result.success) {
      console.error('[v0] [Jobs API] Error fetching jobs:', result.error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    let jobs = result.data || []

    // Apply additional filters if needed
    if (ownerId) {
      jobs = jobs.filter(j => j.owner_id === ownerId)
    }

    // Apply pagination
    const totalCount = jobs.length
    jobs = jobs.slice((page - 1) * limit, page * limit)

    console.log('[v0] [Jobs API] Returning ' + jobs.length + ' of ' + totalCount + ' jobs')

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('[v0] [Jobs API] Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      salonName,
      description,
      location,
      salary,
      experience,
      jobType,
      skills,
      status,
      payment_status,
    } = body

    // Validate required fields
    if (!title || !salonName) {
      return NextResponse.json(
        { error: 'Missing required fields: title, salonName' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[v0] Creating new job: ${title} for user: ${user.id}`)

    // Create job record
    const { data: job, error: createError } = await supabase
      .from('jobs')
      .insert({
        title,
        salon_name: salonName,
        description,
        owner_id: user.id,
        location_address: location?.address,
        location_city: location?.city,
        location_state: location?.state,
        location_lat: location?.lat,
        location_lng: location?.lng,
        salary_min: salary?.min,
        salary_max: salary?.max,
        experience_required: experience,
        job_type: jobType,
        skills: skills || [],
        status: status || 'DRAFT',
        payment_status: payment_status || 'pending',
        is_visible: false,
        is_live: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[v0] Error creating job:', createError)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    console.log(`[v0] Job created successfully: ${job.id}`)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job created successfully',
      job,
    })
  } catch (error) {
    console.error('[v0] Error in POST jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
