import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, JobDocument, ObjectId } from '@/lib/mongodb'

// GET - Fetch jobs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const ownerId = searchParams.get('ownerId') || ''
    const isActive = searchParams.get('isActive')

    const db = await connectToDatabase()
    const collection = db.collection<JobDocument>('jobs')

    // Build query
    const query: Record<string, unknown> = {}
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { salonName: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ]
    }
    
    if (ownerId) {
      query.ownerId = ownerId
    }
    
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    // Get total count
    const totalCount = await collection.countDocuments(query)

    // Get paginated results
    const jobs = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ownerId, salonName, title, description, requirements, salary, location } = body

    if (!ownerId || !title || !salary) {
      return NextResponse.json(
        { error: 'Owner ID, title, and salary are required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<JobDocument>('jobs')

    const newJob: JobDocument = {
      ownerId,
      salonName: salonName || '',
      title,
      description: description || '',
      requirements: requirements || [],
      salary,
      location: location || { lat: 0, lng: 0, address: '' },
      isActive: true,
      applicants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(newJob)

    return NextResponse.json({
      success: true,
      jobId: result.insertedId.toString(),
      message: 'Job created successfully'
    })

  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update job
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, ...updateData } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<JobDocument>('jobs')

    const result = await collection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully'
    })

  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete job
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<JobDocument>('jobs')

    const result = await collection.deleteOne({ _id: new ObjectId(jobId) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
