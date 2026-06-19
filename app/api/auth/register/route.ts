import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      password, 
      role, 
      location,
      // Job seeker fields
      dateOfBirth,
      experience,
      skills,
      salaryExpectation,
      identityProofType,
      identityProofUrl,
      passportPhotoUrl,
      // Salon owner fields
      salonName,
      description,
      workingHours,
      logoUrl,
      district,
      area,
      locality
    } = body

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, phone, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate phone format
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit phone number' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['job_seeker', 'salon_owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // CRITICAL FIX: Use Supabase for all auth operations (not MongoDB)
    // This ensures consistency between auth and job data
    const result = await registerUser(
      email.toLowerCase(),
      phone,
      name.trim(),
      password,
      role as 'job_seeker' | 'salon_owner'
    )

    if (!result.success) {
      const statusCode = result.error?.includes('already exists') ? 409 : 400
      return NextResponse.json(
        { error: result.error || 'Registration failed' },
        { status: statusCode }
      )
    }

    const userId = result.data.id

    // TODO: Create role-specific profile in Supabase profiles table
    // This would include job_seeker and salon_owner specific data
    // For now, all required data is stored in the users table

    return NextResponse.json({
      success: true,
      userId,
      email: email.toLowerCase(),
      role,
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

