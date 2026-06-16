import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Client from 'ssh2-sftp-client'

// Map of file categories to Hostinger upload folders
const FOLDER_MAPPING: Record<string, string> = {
  'profile-photo': '/uploads/profile-photos',
  'resume': '/uploads/resumes',
  'payment-screenshot': '/uploads/payment-screenshots',
  'verification-document': '/uploads/verification-documents',
  'banner-logo': '/uploads/banners',
  'salon-gallery': '/uploads/salon-gallery',
}

// Allowed file types and extensions
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
}

// Initialize Supabase client for metadata storage
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(url, key)
}

// Create SFTP connection to Hostinger
async function createSFTPConnection() {
  const sftp = new Client()
  
  const host = process.env.HOSTINGER_SFTP_HOST
  const port = parseInt(process.env.HOSTINGER_SFTP_PORT || '22')
  const username = process.env.HOSTINGER_SFTP_USERNAME
  const password = process.env.HOSTINGER_SFTP_PASSWORD

  if (!host || !username || !password) {
    throw new Error('Hostinger SFTP credentials not configured. Set HOSTINGER_SFTP_HOST, HOSTINGER_SFTP_USERNAME, and HOSTINGER_SFTP_PASSWORD')
  }

  try {
    await sftp.connect({
      host,
      port,
      username,
      password,
    })
    return sftp
  } catch (error) {
    throw new Error(`SFTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Validate file
function validateFile(file: File, category: string): { valid: boolean; error?: string } {
  if (!FOLDER_MAPPING[category]) {
    return { valid: false, error: `Invalid category. Must be one of: ${Object.keys(FOLDER_MAPPING).join(', ')}` }
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

// Upload file to Hostinger SFTP
async function uploadToHostinger(
  sftp: InstanceType<typeof Client>,
  buffer: Buffer,
  remoteFolder: string,
  filename: string
): Promise<string> {
  try {
    // Ensure remote folder exists
    try {
      await sftp.stat(remoteFolder)
    } catch {
      // Folder doesn't exist, create it
      await sftp.mkdir(remoteFolder, true)
    }

    // Upload file
    const remotePath = `${remoteFolder}/${filename}`
    await sftp.put(buffer, remotePath)

    // Generate public URL (adjust domain based on your Hostinger setup)
    const publicUrl = `${process.env.HOSTINGER_PUBLIC_URL || 'https://example.com'}${remoteFolder}/${filename}`
    
    return publicUrl
  } catch (error) {
    throw new Error(`Hostinger upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Save file metadata to Supabase
async function saveFileMetadata(
  supabase: ReturnType<typeof getSupabaseClient>,
  fileData: {
    file_url: string
    file_path: string
    file_type: string
    category: string
    uploaded_by: string
    file_size: number
  }
) {
  try {
    const { error } = await supabase
      .from('file_uploads')
      .insert([{
        file_url: fileData.file_url,
        file_path: fileData.file_path,
        file_type: fileData.file_type,
        category: fileData.category,
        uploaded_by: fileData.uploaded_by,
        file_size: fileData.file_size,
        uploaded_at: new Date().toISOString(),
      }])

    if (error) {
      console.error('[v0] Supabase metadata save error:', error)
      // Don't throw - file was uploaded successfully, just metadata failed
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Metadata save error:', error)
    return false
  }
}

// Handle POST - File upload to Hostinger SFTP
export async function POST(request: NextRequest) {
  let sftp: InstanceType<typeof Client> | null = null

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
    const remoteFolder = FOLDER_MAPPING[category]

    console.log('[v0] Uploading file:', filename, 'to', remoteFolder)

    // Upload to Hostinger
    sftp = await createSFTPConnection()
    const buffer = await file.arrayBuffer()
    const publicUrl = await uploadToHostinger(
      sftp,
      Buffer.from(buffer),
      remoteFolder,
      filename
    )

    // Save metadata to Supabase
    const supabase = getSupabaseClient()
    await saveFileMetadata(supabase, {
      file_url: publicUrl,
      file_path: `${remoteFolder}/${filename}`,
      file_type: file.type,
      category,
      uploaded_by: userId,
      file_size: file.size,
    })

    console.log('[v0] File uploaded successfully:', publicUrl)

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        path: `${remoteFolder}/${filename}`,
        message: 'File uploaded to Hostinger successfully'
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
  } finally {
    // Close SFTP connection
    if (sftp) {
      await sftp.end()
    }
  }
}

// Handle DELETE - Delete file from Hostinger SFTP
export async function DELETE(request: NextRequest) {
  let sftp: InstanceType<typeof Client> | null = null

  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    // Delete from Hostinger
    sftp = await createSFTPConnection()
    await sftp.delete(path)

    // Delete metadata from Supabase
    const supabase = getSupabaseClient()
    await supabase
      .from('file_uploads')
      .delete()
      .eq('file_path', path)

    console.log('[v0] File deleted successfully:', path)

    return NextResponse.json(
      { success: true, message: 'File deleted from Hostinger' },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[v0] Delete error:', errorMessage)
    return NextResponse.json(
      { error: 'Delete failed: ' + errorMessage },
      { status: 500 }
    )
  } finally {
    // Close SFTP connection
    if (sftp) {
      await sftp.end()
    }
  }
}
