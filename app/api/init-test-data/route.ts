import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Check if user already exists in users table
    let existingUser = null
    try {
      const result = await supabase
        .from('users')
        .select('id')
        .eq('email', 'salon@test.com')
        .single()
      existingUser = result.data
    } catch (err) {
      // User doesn't exist yet
    }

    if (existingUser?.id) {
      console.log('[v0] Test user already exists:', existingUser.id)
      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        message: 'Using existing test user'
      })
    }

    // Try to create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'salon@test.com',
      password: 'test123456',
      email_confirm: true,
    })

    let userId: string
    
    if (authError) {
      console.log('[v0] Auth user already exists, retrieving:', authError.message)
      // User already exists in auth, get their ID
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users?.find(u => u.email === 'salon@test.com')
      if (!user?.id) {
        return NextResponse.json({
          success: false,
          error: 'Could not find or create user'
        }, { status: 400 })
      }
      userId = user.id
    } else {
      userId = authData.user?.id || ''
      console.log('[v0] Auth user created:', userId)
    }

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
