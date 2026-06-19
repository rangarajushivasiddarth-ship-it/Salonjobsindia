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

// Note: POST/PUT/DELETE operations for jobs are handled via /api/sync endpoint
