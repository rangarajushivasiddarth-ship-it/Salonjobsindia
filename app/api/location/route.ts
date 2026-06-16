// API route to save user location to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, latitude, longitude, city, area, state, pincode } = body

    if (!userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'userId, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Save location to Supabase locations table
    const { data, error } = await supabase
      .from('locations')
      .upsert({
        userId,
        latitude,
        longitude,
        city: city || '',
        area: area || '',
        state: state || '',
        pincode: pincode || '',
        lastUpdated: new Date().toISOString(),
      }, {
        onConflict: 'userId'
      })

    if (error) {
      console.error('[v0] Error saving location:', error)
      return NextResponse.json(
        { error: 'Failed to save location: ' + error.message },
        { status: 500 }
      )
    }

    // Also update job_seekers or salon_owners profile with location
    const { error: updateError } = await supabase
      .from('job_seekers')
      .update({
        latitude,
        longitude,
        city: city || '',
        area: area || '',
        state: state || '',
        pincode: pincode || ''
      })
      .eq('id', userId)

    if (updateError && updateError.code !== 'PGRST116') {
      console.error('[v0] Error updating job seeker location:', updateError)
      // Non-critical error, continue
    }

    console.log('[v0] Location saved for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Location saved successfully',
      data
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Location save error:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to save location: ' + errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('userId', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || null
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Location fetch error:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to fetch location: ' + errorMessage },
      { status: 500 }
    )
  }
}
