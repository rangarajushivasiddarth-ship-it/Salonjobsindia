import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, JobDocument, ObjectId } from '@/lib/mongodb'

// GET - Fetch jobs with pagination, filters, and subscription validation
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
    const subscriptionsCollection = db.collection('subscriptions')

    // Build query - FIX: Check status === 'live' AND expiration
    const query: Record<string, unknown> = {
      status: 'live', // Only show live jobs
      expiresAt: { $gt: new Date() } // Only show non-expired jobs
    }
    
    if (search) {
      query.$or = [
        { salonName: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (ownerId) {
      query.salonId = ownerId
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

    // Verify salon owner subscriptions for each job
    // Only show jobs from salon owners with active subscriptions
    const verifiedJobs = []
    for (const job of jobs) {
      const subscription = await subscriptionsCollection.findOne({
        userId: job.ownerId,
        status: 'approved',
        expiresAt: { $gt: new Date() }
      })
      
      // Only include job if salon owner has active subscription
      if (subscription) {
        verifiedJobs.push(job)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: verifiedJobs,
      pagination: {
        page,
        limit,
        totalCount: verifiedJobs.length, // Use verified count
        totalPages: Math.ceil(verifiedJobs.length / limit)
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

// POST - Create new job (must have valid payment before going live)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      salonId, 
      salonName, 
      role, 
      skills = [], 
      description = '', 
      salaryType,
      salaryFixed,
      salaryRange,
      experience = '',
      jobType = 'full_time',
      location = {},
      contact = ''
    } = body

    // Validate required fields
    if (!salonId || !role || !salaryType) {
      return NextResponse.json(
        { error: 'Missing required fields: salonId, role, salaryType' },
        { status: 400 }
      )
    }

    // Validate location
    if (!location.lat || !location.lng || !location.address) {
      return NextResponse.json(
        { error: 'Invalid location: must include lat, lng, address' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<JobDocument>('jobs')

    const newJob: JobDocument = {
      salonId,
      salonName: salonName || '',
      role,
      skills,
      description,
      salaryType,
      salaryFixed: salaryFixed || '',
      salaryRange: salaryRange || '',
      experience,
      jobType,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        state: location.state || '',
        city: location.city || '',
        area: location.area || '',
        locality: location.locality || ''
      },
      contact,
      status: 'pending_payment', // FIX: Start in pending_payment
      editsUsed: 0,
      maxEdits: 3,
      viewsCount: 0,
      applicationsCount: 0,
      isVerified: false,
      paymentId: '', // FIX: Will be set when payment approved (required)
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year, updated on payment
      isActive: false, // FIX: Not active until payment approved AND not expired
      createdAt: new Date(),
      updatedAt: new Date()
    } as any

    const result = await collection.insertOne(newJob)
    
    console.log('[v0] Job created with pending_payment status:', result.insertedId)

    return NextResponse.json({
      success: true,
      jobId: result.insertedId.toString(),
      status: 'pending_payment',
      message: 'Job created successfully. Please submit payment to make it live.'
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
