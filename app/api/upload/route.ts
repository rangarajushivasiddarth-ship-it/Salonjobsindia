import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Map of file categories to Supabase storage buckets
const BUCKET_MAPPING: Record<string, string> = {
  'profile-photo': 'profile-photos',
  'resume': 'resumes',
  'payment-screenshot': 'payment-screenshots',
  'verification-document': 'verification-documents',
  'banner-logo': 'banners',
  'salon-gallery': 'salon-gallery',
}

// Allowed file types and extensions
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
}

// Initialize Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, key)
}

// Validate file
function validateFile(file: File, category: string): { valid: boolean; error?: string } {
  if (!BUCKET_MAPPING[category]) {
    return { valid: false, error: `Invalid category. Must be one of: ${Object.keys(BUCKET_MAPPING).join(', ')}` }
  }

  if (!ALLOWED_TYPES[file.type]) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF allowed' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large. Max 10MB' }
  }

  return { valid: true }
}

// Generate safe filename
function generateSafeFilename(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin'

  // Remove unsafe characters and limit length
  const safeName = originalName
    .split('.')[0]
    .replace(/[^a-z0-9]/gi, '')
    .substring(0, 20)

  return `${userId}-${timestamp}-${randomId}.${extension}`
}

// Handle POST - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
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

    // Validate file
    const validation = validateFile(file, category)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Generate safe filename
    const filename = generateSafeFilename(file.name, userId)
    const bucketName = BUCKET_MAPPING[category]
    const filePath = `${userId}/${filename}`

    console.log('[v0] Uploading file to Supabase Storage:', bucketName, filePath)

    // Upload to Supabase Storage
    const supabase = getSupabaseClient()
    const buffer = await file.arrayBuffer()

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, Buffer.from(buffer), {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    // Get public URL for public buckets
    let publicUrl = ''
    if (['profile-photos', 'banners', 'salon-gallery'].includes(bucketName)) {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    }

    // Save metadata to Supabase database
    const { error: metadataError } = await supabase
      .from('file_metadata')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_category: category,
        file_size: file.size,
        file_type: file.type,
        public_url: publicUrl,
        storage_location: 'supabase',
        uploaded_by: userId,
      })

    if (metadataError) {
      console.error('[v0] Metadata save error:', metadataError)
      // Don't throw - file was uploaded successfully
    }

    console.log('[v0] File uploaded successfully:', filePath)

    return NextResponse.json(
      {
        success: true,
        url: publicUrl || filePath,
        path: filePath,
        bucket: bucketName,
        message: 'File uploaded to Supabase Storage successfully'
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
    const { path, bucket } = await request.json()

    if (!path || !bucket) {
      return NextResponse.json(
        { error: 'Path and bucket are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`)
    }

    // Delete metadata from database
    const { error: metadataError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('file_path', path)

    if (metadataError) {
      console.error('[v0] Metadata delete error:', metadataError)
      // Don't throw - file was deleted successfully
    }

    console.log('[v0] File deleted successfully:', path)

    return NextResponse.json(
      { success: true, message: 'File deleted from Supabase Storage' },
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
