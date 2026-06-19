import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File must be under 5MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()

    // Upload to Vercel Blob
    const blob = await put(`payments/screenshots/${Date.now()}-${file.name}`, buffer, {
      access: 'private',
      contentType: file.type,
    })

    console.log('[v0] Screenshot uploaded to Blob:', blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: 'Screenshot uploaded successfully'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Upload error:', errorMessage)
    return NextResponse.json(
      { error: 'Upload failed: ' + errorMessage },
      { status: 500 }
    )
  }
}
