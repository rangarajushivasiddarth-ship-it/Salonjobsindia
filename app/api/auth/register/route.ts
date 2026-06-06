import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, UserDocument, JobSeekerDocument, SalonOwnerDocument } from '@/lib/mongodb'
import { hash } from 'bcryptjs'

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

    const db = await connectToDatabase()
    const usersCollection = db.collection<UserDocument>('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create base user document
    const newUser: UserDocument = {
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await usersCollection.insertOne(newUser)
    const userId = result.insertedId.toString()

    // Normalize location data
    const normalizedLocation = location ? {
      latitude: Number(location.latitude || 0),
      longitude: Number(location.longitude || 0),
      address: location.address || '',
      city: location.city || '',
      district: location.district || '',
      state: location.state || '',
      country: location.country || 'India',
      postalCode: location.postalCode || ''
    } : {
      latitude: 0,
      longitude: 0,
      address: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      postalCode: ''
    }

    // Create role-specific profile with location data
    if (role === 'job_seeker') {
      const jobSeekersCollection = db.collection<JobSeekerDocument>('job_seekers')
      await jobSeekersCollection.insertOne({
        userId,
        name: name.trim(),
        role: '',
        dateOfBirth: dateOfBirth || '',
        experience: experience || '',
        skills: Array.isArray(skills) ? skills : [],
        salaryExpectation: salaryExpectation || '',
        location: {
          lat: normalizedLocation.latitude,
          lng: normalizedLocation.longitude,
          address: normalizedLocation.address,
          city: normalizedLocation.city,
          district: normalizedLocation.district,
          state: normalizedLocation.state,
          country: normalizedLocation.country,
          postalCode: normalizedLocation.postalCode
        },
        identityProof: {
          type: identityProofType || '',
          verified: false,
          url: identityProofUrl || ''
        },
        passportPhotoUrl: passportPhotoUrl || '',
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)
    } else if (role === 'salon_owner') {
      const ownersCollection = db.collection<SalonOwnerDocument>('salon_owners')
      await ownersCollection.insertOne({
        userId,
        salonName: salonName || '',
        ownerName: name.trim(),
        phone,
        email: email.toLowerCase(),
        address: area || locality || '',
        location: {
          latitude: normalizedLocation.latitude,
          longitude: normalizedLocation.longitude,
          address: normalizedLocation.address,
          city: normalizedLocation.city,
          district: normalizedLocation.district || district || '',
          state: normalizedLocation.state,
          country: normalizedLocation.country,
          area: area || '',
          locality: locality || ''
        } as any,
        description: description || '',
        workingHours: workingHours || '',
        logoUrl: logoUrl || '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)
    }

    console.log('[v0] User registered successfully:', userId, 'Role:', role)

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

