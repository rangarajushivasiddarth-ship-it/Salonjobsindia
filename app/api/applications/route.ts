import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, ObjectId } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-middleware'
import { validateInput, createApplicationSchema, updateResumeSchema } from '@/lib/input-validation'
import { z } from 'zod'

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

// GET - Fetch applications (requires auth)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

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
// RACE CONDITION FIX: Use unique index to prevent duplicate applications
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const validation = validateInput<typeof createApplicationSchema._type>(createApplicationSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    const { jobId, userId, resumeUrl, coverLetter } = validation.data as z.infer<typeof createApplicationSchema>
    const jobSeekerId = authResult.auth.userId

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

    // Try to insert application - MongoDB will handle duplicates with unique index
    try {
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
    } catch (insertError: any) {
      // Check if it's a duplicate key error (E11000)
      if (insertError.code === 11000) {
        return NextResponse.json(
          { error: 'You have already applied to this job' },
          { status: 409 } // 409 Conflict
        )
      }
      throw insertError
    }
  } catch (error) {
    console.error('[v0] Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}

// PUT - Update application status
// SECURITY FIX: Only salon owner of the job can update application status
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

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
    const applicationsCollection = db.collection<ApplicationDocument>('applications')
    const jobsCollection = db.collection('jobs')

    // Get application
    const application = await applicationsCollection.findOne({
      _id: new ObjectId(applicationId)
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // SECURITY: Verify that the requesting user is the salon owner of this job
    const job = await jobsCollection.findOne({
      _id: new ObjectId(application.jobId)
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Associated job not found' },
        { status: 404 }
      )
    }

    // Check if user is the salon owner
    if (job.salonId !== authResult.auth.userId && authResult.auth.role !== 'admin') {
      console.log(
        `[v0] Unauthorized: User ${authResult.auth.userId} tried to update application for job owned by ${job.salonId}`
      )
      return NextResponse.json(
        { error: 'Unauthorized: You can only update applications for your own jobs' },
        { status: 403 }
      )
    }

    // Update application
    const result = await applicationsCollection.updateOne(
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

    console.log(
      `[v0] Application ${applicationId} status updated to ${status} by user ${authResult.auth.userId}`
    )

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
