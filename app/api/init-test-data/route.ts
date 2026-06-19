import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // First, create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'salon@test.com',
      password: 'test123456',
      email_confirm: true,
    })

    if (authError) {
      console.error('[v0] Auth user creation error:', authError)
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 400 })
    }

    const userId = authData.user?.id
    console.log('[v0] Auth user created:', userId)

    // Then create the users table record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: 'salon@test.com',
          full_name: 'Test Salon Owner',
          phone: '+919999999999',
          role: 'salon_owner',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()

    if (userError) {
      console.error('[v0] Users table error:', userError)
    }

    return NextResponse.json({
      success: !userError,
      userId,
      error: userError?.message,
      data: userData
    })
  } catch (error) {
    console.error('[v0] Init error:', error)
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 })
  }
}
