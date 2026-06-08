import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, ObjectId } from '@/lib/mongodb'

interface ApplicationBody {
  jobId: string
  jobSeekerId: string
  resumeUrl?: string
  coverLetter?: string
}

interface ApplicationDocument {
  _id?: ObjectId
  jobId: string
  jobSeekerId: string
  status: 'applied' | 'viewed' | 'shortlisted' | 'rejected' | 'accepted'
  resumeUrl?: string
  coverLetter?: string
  appliedAt: Date
  updatedAt: Date
}

// GET - Fetch applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const jobSeekerId = searchParams.get('jobSeekerId')
    const status = searchParams.get('status')

    const db = await connectToDatabase()
    const collection = db.collection<ApplicationDocument>('applications')

    const query: Record<string, unknown> = {}
    if (jobId) query.jobId = jobId
    if (jobSeekerId) query.jobSeekerId = jobSeekerId
    if (status) query.status = status

    const applications = await collection.find(query).toArray()

    return NextResponse.json({
      success: true,
      data: applications
    })
  } catch (error) {
    console.error('[v0] Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create application (only allowed for LIVE jobs)
export async function POST(request: NextRequest) {
  try {
    const body: ApplicationBody = await request.json()
    const { jobId, jobSeekerId, resumeUrl, coverLetter } = body

    if (!jobId || !jobSeekerId) {
      return NextResponse.json(
        { error: 'Job ID and Job Seeker ID are required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const jobsCollection = db.collection('jobs')
    const applicationsCollection = db.collection<ApplicationDocument>('applications')

    // Check if job exists and is LIVE
    const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) })
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'live') {
      return NextResponse.json(
        { error: 'Cannot apply to this job. Job is not active.' },
        { status: 400 }
      )
    }

    // Check if already applied
    const existingApplication = await applicationsCollection.findOne({
      jobId: jobId,
      jobSeekerId: jobSeekerId
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // Create application
    const application: ApplicationDocument = {
      jobId,
      jobSeekerId,
      status: 'applied',
      resumeUrl,
      coverLetter,
      appliedAt: new Date(),
      updatedAt: new Date()
    }

    const result = await applicationsCollection.insertOne(application)

    // Update job applicant count
    await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      { $inc: { applicationsCount: 1 } }
    )

    console.log('[v0] Application created successfully:', result.insertedId)

    return NextResponse.json({
      success: true,
      applicationId: result.insertedId.toString(),
      message: 'Application submitted successfully'
    })
  } catch (error) {
    console.error('[v0] Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update application status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, status } = body

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['applied', 'viewed', 'shortlisted', 'rejected', 'accepted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<ApplicationDocument>('applications')

    const result = await collection.updateOne(
      { _id: new ObjectId(applicationId) },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Application status updated:', applicationId)

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully'
    })
  } catch (error) {
    console.error('[v0] Error updating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
