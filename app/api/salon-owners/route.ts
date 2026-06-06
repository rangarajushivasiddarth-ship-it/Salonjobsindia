import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, SalonOwnerDocument, ObjectId } from '@/lib/mongodb'

// GET - Fetch all salon owners (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    const db = await connectToDatabase()
    const collection = db.collection<SalonOwnerDocument>('salon_owners')

    if (ownerId) {
      // Fetch specific owner
      const owner = await collection.findOne({ userId: ownerId })
      return NextResponse.json({
        success: true,
        data: owner
      })
    }

    // Fetch all owners (for admin)
    const owners = await collection.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: owners,
      count: owners.length
    })
  } catch (error) {
    console.error('[v0] Error fetching salon owners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salon owners' },
      { status: 500 }
    )
  }
}

// PUT - Update salon owner profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, salonName, ownerName, phone, email, address, location, description, workingHours, logoUrl, isVerified } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const collection = db.collection<SalonOwnerDocument>('salon_owners')

    const updateData: Partial<SalonOwnerDocument> = {
      updatedAt: new Date()
    }

    if (salonName !== undefined) updateData.salonName = salonName
    if (ownerName !== undefined) updateData.ownerName = ownerName
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (address !== undefined) updateData.address = address
    if (location !== undefined) updateData.location = location as any
    if (description !== undefined) (updateData as any).description = description
    if (workingHours !== undefined) (updateData as any).workingHours = workingHours
    if (logoUrl !== undefined) (updateData as any).logoUrl = logoUrl
    if (isVerified !== undefined) updateData.isVerified = isVerified

    const result = await collection.updateOne(
      { userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Salon owner not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Salon owner profile updated:', userId)

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('[v0] Error updating salon owner:', error)
    return NextResponse.json(
      { error: 'Failed to update salon owner profile' },
      { status: 500 }
    )
  }
}
