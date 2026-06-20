import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch platform statistics
export async function GET() {
  try {
    const supabase = await createClient()

    // Get job stats from Supabase
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    const { count: activeJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'LIVE')

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        message: 'Platform statistics'
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
