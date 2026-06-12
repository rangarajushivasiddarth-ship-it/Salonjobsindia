import { NextRequest, NextResponse } from 'next/server'
import { saveLocation, getLocationsByCity } from '@/lib/data-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      userId,
      latitude,
      longitude,
      address,
      city,
      district,
      state,
      country,
      postalCode,
      formattedAddress,
    } = body

    // Validate required fields
    if (!userId || !latitude || !longitude || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, latitude, longitude, address' },
        { status: 400 }
      )
    }

    // Save location to persistent storage
    const locationData = {
      userId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      city: city || '',
      district: district || '',
      state: state || '',
      country: country || 'India',
      postalCode: postalCode || '',
      formattedAddress: formattedAddress || address,
      timestamp: new Date(),
    }

    saveLocation(locationData)

    return NextResponse.json(
      {
        success: true,
        message: 'Location saved successfully',
        location: locationData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error saving location:', error)
    return NextResponse.json(
      { error: 'Failed to save location' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get('city')

    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      )
    }

    const locations = getLocationsByCity(city)

    return NextResponse.json(
      {
        success: true,
        city,
        count: locations.length,
        locations,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error retrieving locations:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve locations' },
      { status: 500 }
    )
  }
}
