import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, JobSeekerDocument } from '@/lib/mongodb'

// GET - Fetch job seekers with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const location = searchParams.get('location') || ''

    const db = await connectToDatabase()
    const collection = db.collection<JobSeekerDocument>('job_seekers')

    // Build query
    const query: Record<string, unknown> = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role) {
      query.role = { $regex: role, $options: 'i' }
    }
    
    if (location) {
      query['location.address'] = { $regex: location, $options: 'i' }
    }

    // Get total count
    const totalCount = await collection.countDocuments(query)

    // Get paginated results
    const jobSeekers = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: jobSeekers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching job seekers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update job seeker profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      name, 
      role, 
      dateOfBirth, 
      experience, 
      skills, 
      salaryExpectation, 
      location, 
      identityProof,
      passportPhotoUrl
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<JobSeekerDocument>('job_seekers')

    const updateData: Partial<JobSeekerDocument> = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (experience !== undefined) updateData.experience = experience
    if (Array.isArray(skills)) updateData.skills = skills
    if (salaryExpectation !== undefined) updateData.salaryExpectation = salaryExpectation
    if (location !== undefined) updateData.location = location as any
    if (identityProof !== undefined) updateData.identityProof = identityProof as any
    if (passportPhotoUrl !== undefined) updateData.passportPhotoUrl = passportPhotoUrl

    const result = await collection.updateOne(
      { userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Job seeker not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Job seeker profile updated:', userId)

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('[v0] Error updating job seeker:', error)
    return NextResponse.json(
      { error: 'Failed to update job seeker profile' },
      { status: 500 }
    )
  }
}
