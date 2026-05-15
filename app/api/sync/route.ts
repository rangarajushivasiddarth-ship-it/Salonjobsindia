import { put, list, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

// Data file paths in Blob storage
const PENDING_SUBSCRIPTIONS_PATH = 'sync/pending-subscriptions.json'
const PENDING_JOB_PAYMENTS_PATH = 'sync/pending-job-payments.json'
const PENDING_JOB_ALERTS_PATH = 'sync/pending-job-alerts.json'
const APPROVED_USERS_PATH = 'sync/approved-users.json'

interface PendingSubscription {
  id: string
  oderId?: string
  orderId?: string
  userId: string
  userName: string
  userPhone: string
  userEmail?: string
  userRole: string
  planId: string
  planName: string
  planPrice: number
  planDuration: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  processedBy?: string
}

interface PendingJobPayment {
  id: string
  oderId?: string
  orderId?: string
  salonId: string
  salonName: string
  ownerName: string
  ownerPhone: string
  ownerEmail?: string
  jobTitle: string
  jobDetails: Record<string, unknown>
  planId: string
  planName: string
  planPrice: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  processedBy?: string
}

interface ApprovedUser {
  orderId: string
  pendingId?: string
  userId: string
  type: 'subscription' | 'job_payment'
  planName: string
  approvedAt: string
  expiresAt?: string
}

// Helper to read JSON from Blob
async function readBlobJson<T>(pathname: string, defaultValue: T): Promise<T> {
  try {
    const { blobs } = await list({ prefix: pathname })
    if (blobs.length === 0) {
      return defaultValue
    }
    
    // Fetch the blob content directly using the URL
    const response = await fetch(blobs[0].url)
    if (!response.ok) {
      return defaultValue
    }
    
    const text = await response.text()
    return JSON.parse(text) as T
  } catch (error) {
    console.log(`[Sync API] Error reading ${pathname}:`, error)
    return defaultValue
  }
}

// Helper to write JSON to Blob
async function writeBlobJson<T>(pathname: string, data: T): Promise<void> {
  try {
    // Delete existing blob first
    const { blobs } = await list({ prefix: pathname })
    for (const blob of blobs) {
      await del(blob.url)
    }
    
    // Write new data
    await put(pathname, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })
    
    console.log(`[Sync API] Written to ${pathname}`)
  } catch (error) {
    console.error(`[Sync API] Error writing ${pathname}:`, error)
    throw error
  }
}

// GET - Retrieve all pending items (for admin polling)
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const userId = request.nextUrl.searchParams.get('userId')
  
  console.log(`[Sync API] GET request - type: ${type}, userId: ${userId}`)
  
  try {
    if (type === 'pending-subscriptions') {
      const subscriptions = await readBlobJson<PendingSubscription[]>(PENDING_SUBSCRIPTIONS_PATH, [])
      const pending = subscriptions.filter(s => s.status === 'pending')
      console.log(`[Sync API] Returning ${pending.length} pending subscriptions`)
      return NextResponse.json({ success: true, data: pending, timestamp: Date.now() })
    }
    
    if (type === 'pending-job-payments') {
      const payments = await readBlobJson<PendingJobPayment[]>(PENDING_JOB_PAYMENTS_PATH, [])
      const pending = payments.filter(p => p.status === 'pending')
      console.log(`[Sync API] Returning ${pending.length} pending job payments`)
      return NextResponse.json({ success: true, data: pending, timestamp: Date.now() })
    }
    
    if (type === 'pending-job-alerts') {
      const alerts = await readBlobJson<Record<string, unknown>[]>(PENDING_JOB_ALERTS_PATH, [])
      const pending = alerts.filter((a: Record<string, unknown>) => a.status === 'pending')
      console.log(`[Sync API] Returning ${pending.length} pending job alerts`)
      return NextResponse.json({ success: true, data: pending, timestamp: Date.now() })
    }
    
    if (type === 'check-approval' && userId) {
      const approved = await readBlobJson<ApprovedUser[]>(APPROVED_USERS_PATH, [])
      const userApproval = approved.find(a => a.userId === userId)
      console.log(`[Sync API] Checking approval for user ${userId}: ${userApproval ? 'APPROVED' : 'NOT FOUND'}`)
      return NextResponse.json({ 
        success: true, 
        approved: !!userApproval, 
        data: userApproval,
        timestamp: Date.now() 
      })
    }
    
    if (type === 'all-pending') {
      const [subscriptions, jobPayments, jobAlerts] = await Promise.all([
        readBlobJson<PendingSubscription[]>(PENDING_SUBSCRIPTIONS_PATH, []),
        readBlobJson<PendingJobPayment[]>(PENDING_JOB_PAYMENTS_PATH, []),
        readBlobJson<Record<string, unknown>[]>(PENDING_JOB_ALERTS_PATH, []),
      ])
      
      const pendingSubs = subscriptions.filter(s => s.status === 'pending')
      const pendingJobs = jobPayments.filter(p => p.status === 'pending')
      const pendingAlerts = jobAlerts.filter((a: Record<string, unknown>) => a.status === 'pending')
      
      console.log(`[Sync API] All pending - subs: ${pendingSubs.length}, jobs: ${pendingJobs.length}, alerts: ${pendingAlerts.length}`)
      
      return NextResponse.json({ 
        success: true, 
        pendingSubscriptions: pendingSubs,
        pendingJobPayments: pendingJobs,
        pendingJobAlerts: pendingAlerts,
        totalPending: pendingSubs.length + pendingJobs.length + pendingAlerts.length,
        timestamp: Date.now() 
      })
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST - Submit new pending item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body
    
    console.log(`[Sync API] POST request - type: ${type}`, data)
    
    if (type === 'subscription') {
      const subscriptions = await readBlobJson<PendingSubscription[]>(PENDING_SUBSCRIPTIONS_PATH, [])
      
      // Check if already exists
      const existingIndex = subscriptions.findIndex(s => s.id === data.id)
      if (existingIndex >= 0) {
        subscriptions[existingIndex] = { ...subscriptions[existingIndex], ...data }
      } else {
        subscriptions.push({
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
      
      await writeBlobJson(PENDING_SUBSCRIPTIONS_PATH, subscriptions)
      console.log(`[Sync API] Subscription payment submitted: ${data.id}`)
      return NextResponse.json({ success: true, message: 'Subscription payment submitted' })
    }
    
    if (type === 'job-payment') {
      const payments = await readBlobJson<PendingJobPayment[]>(PENDING_JOB_PAYMENTS_PATH, [])
      
      const existingIndex = payments.findIndex(p => p.id === data.id)
      if (existingIndex >= 0) {
        payments[existingIndex] = { ...payments[existingIndex], ...data }
      } else {
        payments.push({
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
      
      await writeBlobJson(PENDING_JOB_PAYMENTS_PATH, payments)
      console.log(`[Sync API] Job payment submitted: ${data.id}`)
      return NextResponse.json({ success: true, message: 'Job payment submitted' })
    }
    
    if (type === 'job-alert') {
      const alerts = await readBlobJson<Record<string, unknown>[]>(PENDING_JOB_ALERTS_PATH, [])
      
      const existingIndex = alerts.findIndex((a: Record<string, unknown>) => a.id === data.id)
      if (existingIndex >= 0) {
        alerts[existingIndex] = { ...alerts[existingIndex], ...data }
      } else {
        alerts.push({
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
      
      await writeBlobJson(PENDING_JOB_ALERTS_PATH, alerts)
      console.log(`[Sync API] Job alert submitted: ${data.id}`)
      return NextResponse.json({ success: true, message: 'Job alert submitted' })
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] POST error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}

// PUT - Approve/Reject pending item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, action, adminId, reason } = body
    
    console.log(`[Sync API] PUT request - type: ${type}, id: ${id}, action: ${action}`)
    
    if (type === 'subscription') {
      const subscriptions = await readBlobJson<PendingSubscription[]>(PENDING_SUBSCRIPTIONS_PATH, [])
      const index = subscriptions.findIndex(s => s.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }
      
      const subscription = subscriptions[index]
      subscription.status = action === 'approve' ? 'approved' : 'rejected'
      subscription.processedAt = new Date().toISOString()
      subscription.processedBy = adminId
      
      await writeBlobJson(PENDING_SUBSCRIPTIONS_PATH, subscriptions)
      
      // If approved, add to approved users list
      if (action === 'approve') {
        const approved = await readBlobJson<ApprovedUser[]>(APPROVED_USERS_PATH, [])
        
        // Remove any existing approval for this user
        const filtered = approved.filter(a => a.userId !== subscription.userId)
        
        // Add new approval
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (subscription.planDuration || 30))
        
        filtered.push({
          orderId: subscription.id,
          pendingId: subscription.id,
          userId: subscription.userId,
          type: 'subscription',
          planName: subscription.planName,
          approvedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        })
        
        await writeBlobJson(APPROVED_USERS_PATH, filtered)
        console.log(`[Sync API] User ${subscription.userId} approved for subscription ${subscription.planName}`)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Subscription ${action}d`,
        subscription 
      })
    }
    
    if (type === 'job-payment') {
      const payments = await readBlobJson<PendingJobPayment[]>(PENDING_JOB_PAYMENTS_PATH, [])
      const index = payments.findIndex(p => p.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Job payment not found' }, { status: 404 })
      }
      
      const payment = payments[index]
      payment.status = action === 'approve' ? 'approved' : 'rejected'
      payment.processedAt = new Date().toISOString()
      payment.processedBy = adminId
      
      await writeBlobJson(PENDING_JOB_PAYMENTS_PATH, payments)
      
      // If approved, add to approved users list
      if (action === 'approve') {
        const approved = await readBlobJson<ApprovedUser[]>(APPROVED_USERS_PATH, [])
        
        // Remove any existing approval for this salon
        const filtered = approved.filter(a => a.userId !== payment.salonId)
        
        // Add new approval
        filtered.push({
          orderId: payment.id,
          pendingId: payment.id,
          userId: payment.salonId,
          type: 'job_payment',
          planName: payment.planName,
          approvedAt: new Date().toISOString(),
        })
        
        await writeBlobJson(APPROVED_USERS_PATH, filtered)
        console.log(`[Sync API] Salon ${payment.salonId} job payment approved`)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Job payment ${action}d`,
        payment 
      })
    }
    
    if (type === 'job-alert') {
      const alerts = await readBlobJson<Record<string, unknown>[]>(PENDING_JOB_ALERTS_PATH, [])
      const index = alerts.findIndex((a: Record<string, unknown>) => a.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Job alert not found' }, { status: 404 })
      }
      
      const alert = alerts[index]
      alert.status = action === 'approve' ? 'approved' : 'rejected'
      alert.processedAt = new Date().toISOString()
      alert.processedBy = adminId
      if (reason) alert.rejectionReason = reason
      
      await writeBlobJson(PENDING_JOB_ALERTS_PATH, alerts)
      console.log(`[Sync API] Job alert ${id} ${action}d`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Job alert ${action}d`,
        alert 
      })
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[Sync API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
