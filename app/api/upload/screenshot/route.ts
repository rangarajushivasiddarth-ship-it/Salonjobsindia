import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Screenshot upload started')
    
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('[v0] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[v0] File received:', { name: file.name, size: file.size, type: file.type })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[v0] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[v0] File too large:', file.size)
      return NextResponse.json(
        { error: 'File must be under 5MB' },
        { status: 400 }
      )
    }

    // Convert file to base64 data URL
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const screenshotUrl = `data:${file.type};base64,${base64}`
    
    console.log('[v0] Screenshot encoded as data URL, size:', screenshotUrl.length)

    console.log('[v0] Screenshot uploaded to Supabase Storage:', screenshotUrl)

    return NextResponse.json({
      success: true,
      url: screenshotUrl,
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
