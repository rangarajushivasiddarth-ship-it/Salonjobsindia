import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, UserDocument } from '@/lib/mongodb'
import { compare } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password } = body

    // Validate input
    if ((!email && !phone) || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection<UserDocument>('users')

    // Find user by email or phone
    const user = await usersCollection.findOne({
      $or: [
        { email: email || '' },
        { phone: phone || '' }
      ]
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Return user data (excluding password)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
