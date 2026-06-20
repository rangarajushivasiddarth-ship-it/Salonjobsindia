import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET - Fetch job seeker preference
 * Returns the current preference (looking_for_work or not_looking_for_job)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's job seeker preference
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id, job_seeker_preference')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('[v0] Error fetching job seeker preference:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preference: userData?.job_seeker_preference || 'looking_for_work',
      userId: user.id,
    })
  } catch (error) {
    console.error('[v0] Error in GET job seeker preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST/PUT - Update job seeker preference
 * Syncs the preference to Supabase users table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preference } = body

    // Validate preference value
    if (!['looking_for_work', 'not_looking_for_job'].includes(preference)) {
      return NextResponse.json(
        { error: 'Invalid preference. Must be "looking_for_work" or "not_looking_for_job"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[v0] Updating job seeker preference for user ${user.id} to: ${preference}`)

    // Update user's job seeker preference in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        job_seeker_preference: preference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[v0] Error updating job seeker preference:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preference' },
        { status: 500 }
      )
    }

    console.log(`[v0] Job seeker preference updated successfully for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Preference updated successfully',
      preference: updatedUser?.job_seeker_preference || preference,
      userId: user.id,
    })
  } catch (error) {
    console.error('[v0] Error in POST job seeker preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Also handle PUT for preference update
 */
export async function PUT(request: NextRequest) {
  return POST(request)
}
