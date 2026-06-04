import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

// Handle POST - File upload to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    // Check for BLOB token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[v0] BLOB_READ_WRITE_TOKEN not configured')
      return NextResponse.json(
        { error: 'Upload service not properly configured' },
        { status: 503 }
      )
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = `${category}/${timestamp}-${randomId}-${file.name}`;

    // Upload to Vercel Blob
    const buffer = await file.arrayBuffer();
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
    });

    console.log('[v0] File uploaded successfully:', blob.url);

    return NextResponse.json(
      {
        success: true,
        url: blob.url,
        message: 'File uploaded successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Upload error:', errorMessage);
    return NextResponse.json(
      { error: 'Upload failed: ' + errorMessage },
      { status: 500 }
    );
  }
}

// Handle DELETE - Delete file from Vercel Blob
export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[v0] BLOB_READ_WRITE_TOKEN not configured for delete');
      return NextResponse.json(
        { error: 'Delete service not properly configured' },
        { status: 503 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob
    await del(url);
    
    console.log('[v0] File deleted successfully:', url);

    return NextResponse.json(
      { success: true, message: 'File deleted' },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Delete error:', errorMessage);
    return NextResponse.json(
      { error: 'Delete failed: ' + errorMessage },
      { status: 500 }
    );
  }
}
