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

// POST - Create or update job seeker profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...profileData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<JobSeekerDocument>('job_seekers')

    // Update or insert job seeker profile
    const result = await collection.updateOne(
      { userId },
      {
        $set: {
          ...profileData,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId?.toString()
    })

  } catch (error) {
    console.error('Error updating job seeker:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
