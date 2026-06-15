// Database indices and migrations for production readiness
// This file documents all required indices and how to create them

import { Db } from 'mongodb'

/**
 * Create all required database indices
 * Should be run once during database initialization
 * 
 * PERFORMANCE FIX #1: These indices are CRITICAL for production
 * Without them, queries will be O(n) full table scans
 */
export async function createProductionIndices(db: Db): Promise<void> {
  console.log('[v0] Creating production indices...')

  try {
    // ============ JOBS COLLECTION ============
    // Performance: Filter by status and expiration (most frequent query)
    await db.collection('jobs').createIndex({ status: 1, expiresAt: 1 })
    console.log('[v0] Created index: jobs(status, expiresAt)')

    // Performance: Filter by salon and status
    await db.collection('jobs').createIndex({ salonId: 1, status: 1 })
    console.log('[v0] Created index: jobs(salonId, status)')

    // Performance: Location-based queries
    await db.collection('jobs').createIndex({ 'location.city': 1, status: 1 })
    console.log('[v0] Created index: jobs(location.city, status)')

    // Expiration cleanup jobs
    await db.collection('jobs').createIndex({ expiresAt: 1 })
    console.log('[v0] Created index: jobs(expiresAt)')

    // ============ APPLICATIONS COLLECTION ============
    // CRITICAL: Prevent duplicate applications (unique index)
    await db
      .collection('applications')
      .createIndex({ jobId: 1, jobSeekerId: 1 }, { unique: true })
    console.log('[v0] Created unique index: applications(jobId, jobSeekerId)')

    // Performance: Salon owner viewing applications for their jobs
    await db.collection('applications').createIndex({ jobId: 1, status: 1 })
    console.log('[v0] Created index: applications(jobId, status)')

    // Performance: Job seeker viewing their applications
    await db.collection('applications').createIndex({ jobSeekerId: 1, appliedAt: -1 })
    console.log('[v0] Created index: applications(jobSeekerId, appliedAt DESC)')

    // ============ PAYMENTS COLLECTION ============
    // Performance: Admin dashboard pagination
    await db.collection('payments').createIndex({ status: 1, submittedAt: -1 })
    console.log('[v0] Created index: payments(status, submittedAt DESC)')

    // Performance: Track payment to job linkage
    await db.collection('payments').createIndex({ jobId: 1 })
    console.log('[v0] Created index: payments(jobId)')

    // Performance: User payment history
    await db.collection('payments').createIndex({ userId: 1, createdAt: -1 })
    console.log('[v0] Created index: payments(userId, createdAt DESC)')

    // ============ USERS COLLECTION ============
    // Unique email constraint
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    console.log('[v0] Created unique index: users(email)')

    // Unique phone constraint
    await db.collection('users').createIndex({ phone: 1 }, { unique: true })
    console.log('[v0] Created unique index: users(phone)')

    // ============ SUBSCRIPTIONS COLLECTION ============
    // Performance: Check active subscriptions
    await db.collection('subscriptions').createIndex({ userId: 1, status: 1 })
    console.log('[v0] Created index: subscriptions(userId, status)')

    // Expiration tracking
    await db.collection('subscriptions').createIndex({ expiresAt: 1 })
    console.log('[v0] Created index: subscriptions(expiresAt)')

    console.log('[v0] All production indices created successfully!')
  } catch (error) {
    console.error('[v0] Error creating indices:', error)
    throw error
  }
}

/**
 * Data migration steps for fixing existing data
 */
export const dataMigrationSteps = {
  '001_fix_job_payment_ids': {
    name: 'Set paymentId on all live jobs that are missing it',
    description: 'Jobs with status=live should have paymentId set',
    query: `
      db.jobs.updateMany(
        { status: 'live', paymentId: { $in: [null, ''] } },
        { $set: { paymentId: 'NEEDS_MANUAL_REVIEW' } }
      )
    `,
    verification: `
      db.jobs.find({ status: 'live', paymentId: { $in: [null, ''] } }).count()
      // Should return 0
    `
  },

  '002_set_job_expiration_dates': {
    name: 'Set expiresAt for jobs without expiration',
    description: 'All jobs should have an expiration date',
    query: `
      db.jobs.updateMany(
        { expiresAt: { $in: [null, ''] } },
        { $set: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
      )
    `,
    verification: `
      db.jobs.find({ expiresAt: { $in: [null, ''] } }).count()
      // Should return 0
    `
  },

  '003_remove_orphaned_applications': {
    name: 'Remove applications for deleted jobs',
    description: 'Clean up applications where job no longer exists',
    query: `
      // First, find all job IDs
      const jobIds = db.jobs.find({}, { _id: 1 }).toArray().map(j => j._id);
      
      // Remove applications with non-existent job IDs
      db.applications.deleteMany({
        jobId: { $nin: jobIds }
      })
    `,
    verification: `
      // Run aggregation to find orphaned applications
      db.applications.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'job'
          }
        },
        { $match: { job: { $size: 0 } } },
        { $count: 'orphaned' }
      ]).toArray()
      // Should return empty array or count: 0
    `
  },

  '004_fix_subscription_data': {
    name: 'Remove duplicates and fix invalid subscriptions',
    description: 'Ensure each user has only one active subscription',
    query: `
      // Group by userId and status=approved, keep only newest
      db.subscriptions.aggregate([
        { $match: { status: 'approved' } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$userId',
            latestId: { $first: '$_id' },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]).toArray().forEach(doc => {
        // Delete duplicates, keep latest
        db.subscriptions.deleteMany({
          userId: doc._id,
          _id: { $ne: doc.latestId },
          status: 'approved'
        })
      })
    `,
    verification: `
      db.subscriptions.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).count()
      // Should return 0
    `
  },

  '005_cleanup_old_data': {
    name: 'Archive or delete old expired data',
    description: 'Move expired jobs and old payments to archive',
    query: `
      // Delete jobs expired more than 6 months ago
      db.jobs.deleteMany({
        expiresAt: { $lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      })
    `,
    verification: `
      db.jobs.find({
        expiresAt: { $lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      }).count()
      // Should return 0
    `
  }
}

/**
 * Database maintenance function
 * Run this weekly to keep database healthy
 */
export async function databaseMaintenance(db: Db): Promise<void> {
  console.log('[v0] Running database maintenance...')

  try {
    // 1. Remove expired jobs (set isActive = false)
    const expiredJobsResult = await db.collection('jobs').updateMany(
      {
        expiresAt: { $lt: new Date() },
        isActive: true
      },
      {
        $set: { isActive: false, updatedAt: new Date() }
      }
    )
    console.log(`[v0] Deactivated ${expiredJobsResult.modifiedCount} expired jobs`)

    // 2. Remove expired subscriptions (set status = expired)
    const expiredSubscriptionsResult = await db.collection('subscriptions').updateMany(
      {
        expiresAt: { $lt: new Date() },
        status: 'approved'
      },
      {
        $set: { status: 'expired', updatedAt: new Date() }
      }
    )
    console.log(
      `[v0] Marked ${expiredSubscriptionsResult.modifiedCount} subscriptions as expired`
    )

    // 3. Clean up old audit logs (keep 3 months)
    const oldLogsResult = await db.collection('audit_logs')?.deleteMany({
      timestamp: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    })
    console.log(`[v0] Deleted ${oldLogsResult?.deletedCount || 0} old audit logs`)

    console.log('[v0] Database maintenance completed successfully')
  } catch (error) {
    console.error('[v0] Error during database maintenance:', error)
    throw error
  }
}
