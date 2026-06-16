# Supabase Setup Guide for SalonJobsIndia

## Overview
This guide walks through setting up Supabase Storage buckets with proper Row Level Security (RLS) policies for the SalonJobsIndia application.

## Step 1: Create Storage Buckets

In your Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Create the following buckets (use exact names):
   - `profile-photos` (public)
   - `resumes` (public)
   - `payment-screenshots` (private)
   - `verification-documents` (private)
   - `banner-logos` (public)
   - `salon-gallery` (public)

## Step 2: Set Up RLS Policies

Run the SQL migration in `supabase/migrations/setup-storage-buckets.sql`:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/migrations/setup-storage-buckets.sql`
4. Click **Run**

### What This Does:

**Public Buckets** (profile-photos, resumes, banner-logos, salon-gallery):
- Anyone can read files
- Authenticated users can upload their own files (in their user ID folder)
- Users can only delete their own files

**Private Buckets** (payment-screenshots, verification-documents):
- Only admin users can read files
- Authenticated users can upload (in their user ID folder)
- Only admins can delete files

## Step 3: Create Required Tables

Before uploading works, make sure these Supabase tables exist:
- `admin_users` - with at least `id` column
- `salon_owners` - with at least `id` column
- `job_seekers` - with at least `id` column

## Step 4: Environment Variables

Verify these environment variables are set in your project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## File Upload Structure

All uploads organize files by user ID in subdirectories:

```
profile-photos/
  ├── user-id-1/
  │   └── 1718555123456-abc123.jpg
  └── user-id-2/
      └── 1718555456789-def456.png

resumes/
  └── user-id-1/
      └── 1718555789012-xyz789.pdf

payment-screenshots/
  └── salon-owner-1/
      └── 1718556012345-qwerty.png
```

## Upload Usage

### From Next.js Client:

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('category', 'profile-photo')
formData.append('userId', currentUserId)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const { url, path, bucket } = await response.json()
// url: Public URL for accessing file
// path: File path in bucket (for deletion)
// bucket: Bucket name
```

### Download/Access Files:

Public buckets (profile-photos, resumes, banner-logos, salon-gallery):
```
https://your-project.supabase.co/storage/v1/object/public/{bucket}/{path}
```

Private buckets (payment-screenshots, verification-documents):
- Generate signed URLs on the server with 1-hour expiration
- Use the API route `/api/download` with auth token

## Troubleshooting

### "Access Denied" on Upload
- Check that user is authenticated
- Ensure user ID is in the folder path
- Verify RLS policies are enabled

### Admin Can't See Payment Screenshots
- Add user ID to `admin_users` table
- Wait a few seconds for RLS policy cache to clear
- Verify the admin_users table exists

### Public Files Not Accessible
- Check bucket is marked as public in Storage settings
- Verify file path is correct
- Try generating a signed URL instead

## Security Notes

1. **Private Buckets**: Payment screenshots and verification documents are restricted to admins only
2. **User Isolation**: Each user can only see/upload in their own folder
3. **File Types**: Restricted to images (JPEG, PNG, WebP) and PDFs
4. **File Size**: Maximum 10MB per file
5. **Signed URLs**: Private files use 1-hour expiration signed URLs

## Next Steps

After setting up storage:
1. Verify Supabase tables exist (Task 4)
2. Create RLS policies for database tables (Task 4)
3. Test file uploads through the UI
4. Set up admin dashboard to manage files
