import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Map of file categories to Supabase storage buckets
const BUCKET_MAPPING: Record<string, string> = {
  'profile-photo': 'profile-photos',
  'resume': 'resumes',
  'payment-screenshot': 'payment-screenshots',
  'verification-document': 'verification-documents',
  'banner-logo': 'banner-logos',
  'salon-gallery': 'salon-gallery',
}

// Initialize Supabase client only at runtime
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(url, key)
}

// Handle POST - File upload to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!category || !BUCKET_MAPPING[category]) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: ' + Object.keys(BUCKET_MAPPING).join(', ') },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const extension = file.name.split('.').pop() || 'bin'
    const filename = `${userId}/${timestamp}-${randomId}.${extension}`
    const bucket = BUCKET_MAPPING[category]

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError || !data) {
      console.error('[v0] Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed: ' + (uploadError?.message || 'Unknown error') },
        { status: 500 }
      )
    }

    // Generate public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[v0] File uploaded successfully to Supabase:', data.path)

    return NextResponse.json(
      {
        success: true,
        url: publicData.publicUrl,
        path: data.path,
        bucket: bucket,
        message: 'File uploaded successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[v0] Upload error:', errorMessage)
    return NextResponse.json(
      { error: 'Upload failed: ' + errorMessage },
      { status: 500 }
    )
  }
}

// Handle DELETE - Delete file from Supabase Storage
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const { path, bucket } = await request.json()

    if (!path || !bucket) {
      return NextResponse.json(
        { error: 'Path and bucket are required' },
        { status: 400 }
      )
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (deleteError) {
      console.error('[v0] Supabase delete error:', deleteError)
      return NextResponse.json(
        { error: 'Delete failed: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log('[v0] File deleted successfully:', path)

    return NextResponse.json(
      { success: true, message: 'File deleted' },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[v0] Delete error:', errorMessage)
    return NextResponse.json(
      { error: 'Delete failed: ' + errorMessage },
      { status: 500 }
    )
  }
}
