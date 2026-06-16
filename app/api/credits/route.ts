import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/credits/unlock-contact
 * Allows salon owners to use credits to unlock job seeker contact information
 * 
 * Body:
 * - salonOwnerId: string (who is unlocking)
 * - jobSeekerId: string (whose contact is being unlocked)
 * - cost: number (default 1, number of credits to deduct)
 * 
 * Returns:
 * - success: boolean
 * - contact: { name, phone, email, location } if successful
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salonOwnerId, jobSeekerId, cost = 1 } = body
    
    if (!salonOwnerId || !jobSeekerId) {
      return NextResponse.json(
        { error: 'Missing required fields: salonOwnerId, jobSeekerId' },
        { status: 400 }
      )
    }
    
    if (salonOwnerId === jobSeekerId) {
      return NextResponse.json(
        { error: 'Cannot unlock own contact information' },
        { status: 400 }
      )
    }
    
    console.log('[v0] Attempting to unlock contact:', { salonOwnerId, jobSeekerId, cost })
    
    // Production steps:
    // 1. Verify salon owner has active subscription (status = 'approved' and not expired)
    // 2. Check if already unlocked (query contact_unlocks table)
    // 3. Get salon owner's credit balance from salon_owners table or credits table
    // 4. If credits >= cost:
    //    a. Deduct credits from balance
    //    b. Create record in contact_unlocks table
    //    c. Create record in credit_transactions table (for audit)
    //    d. Return contact details
    // 5. If credits < cost:
    //    a. Return error "Insufficient credits"
    //    c. Suggest purchasing more credits
    
    return NextResponse.json({
      success: true,
      message: 'Contact unlocked successfully',
      creditsUsed: cost,
      contact: {
        // These would come from the database
        name: 'Job Seeker Name',
        phone: '+91 98765 43210',
        email: 'jobseeker@example.com',
        location: 'Mumbai, Maharashtra',
        profileUrl: '/profile/jobseeker123'
      },
      remainingCredits: 9, // salonOwner.credits - cost
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Error unlocking contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/credits/balance
 * Get current credit balance for a salon owner
 * 
 * Query params:
 * - salonOwnerId: string
 * 
 * Returns:
 * - credits: number
 * - totalSpent: number
 * - totalPurchased: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const salonOwnerId = searchParams.get('salonOwnerId')
    
    if (!salonOwnerId) {
      return NextResponse.json(
        { error: 'Missing salonOwnerId query parameter' },
        { status: 400 }
      )
    }
    
    console.log('[v0] Fetching credit balance for:', salonOwnerId)
    
    // Production: Query from salon_owners.credits or credits table
    
    return NextResponse.json({
      success: true,
      credits: 10,
      totalPurchased: 20,
      totalSpent: 10,
      lastPurchaseDate: '2024-01-15',
      subscriptionStatus: 'active',
      subscriptionExpiry: '2024-02-15'
    })
  } catch (error) {
    console.error('[v0] Error fetching credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
