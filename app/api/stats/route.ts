import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET - Fetch platform statistics
export async function GET() {
  try {
    const db = await connectToDatabase()

    // Get counts from all collections
    const [
      totalUsers,
      totalJobSeekers,
      totalSalonOwners,
      totalJobs,
      activeJobs
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('job_seekers').countDocuments(),
      db.collection('salon_owners').countDocuments(),
      db.collection('jobs').countDocuments(),
      db.collection('jobs').countDocuments({ isActive: true })
    ])

    // Get subscription stats
    const subscribedJobSeekers = await db.collection('job_seekers').countDocuments({
      isSubscribed: true
    })

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentRegistrations = await db.collection('users').countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    })

    // Get applications count
    const totalApplications = await db.collection('applications').countDocuments()
    const successfulHires = await db.collection('applications').countDocuments({
      status: 'hired'
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalJobSeekers,
        totalSalonOwners,
        totalJobs,
        activeJobs,
        subscribedJobSeekers,
        recentRegistrations,
        totalApplications,
        successfulHires
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
