import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, UserDocument, JobSeekerDocument, SalonOwnerDocument } from '@/lib/mongodb'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role, location } = body

    // Validate input
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection<UserDocument>('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const newUser: UserDocument = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await usersCollection.insertOne(newUser)

    // Create role-specific profile with location data
    if (role === 'job_seeker') {
      const jobSeekersCollection = db.collection<JobSeekerDocument>('job_seekers')
      await jobSeekersCollection.insertOne({
        userId: result.insertedId.toString(),
        name,
        role: '',
        dateOfBirth: '',
        experience: '',
        skills: [],
        salaryExpectation: '',
        location: location || { lat: 0, lng: 0, address: '', city: '', district: '', state: '', country: '' },
        identityProof: { type: '', verified: false },
        passportPhotoUrl: '',
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else if (role === 'salon_owner') {
      const ownersCollection = db.collection<SalonOwnerDocument>('salon_owners')
      await ownersCollection.insertOne({
        userId: result.insertedId.toString(),
        salonName: '',
        ownerName: name,
        phone,
        email,
        address: '',
        location: location || { lat: 0, lng: 0, city: '', district: '', state: '', country: '', address: '' },
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
