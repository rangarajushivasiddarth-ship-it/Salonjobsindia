import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Admin credentials
const ADMIN_EMAIL = 'fitonzeprofessionals@gmail.com'
const ADMIN_PASSWORD = 'fitonze123'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Admin login attempt for:', email)

    // Simple credential check
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.error('[v0] Invalid credentials for:', email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Get user profile from public.users table
    const supabase = await createClient()
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single()

    let user = {
      id: 'admin-' + Date.now(),
      email: ADMIN_EMAIL,
      name: 'Fitonze Admin',
      role: 'admin' as const
    }

    // If user exists in DB, use that data
    if (userProfile && !profileError) {
      user = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.full_name || 'Admin',
        role: userProfile.role
      }
    }

    console.log('[v0] Admin logged in successfully:', user.email)

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
