# Supabase Storage Setup Instructions

This document explains how to set up Supabase Storage buckets for the SalonJobsIndia application.

## Prerequisites

- Supabase project created at https://supabase.com
- Access to Supabase SQL editor

## Setup Steps

### 1. Create Storage Buckets

Run the SQL migration at `supabase/migrations/setup-storage-buckets.sql` in your Supabase SQL editor:

1. Go to your Supabase project → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/migrations/setup-storage-buckets.sql`
4. Click "Run"

This will:
- Create 6 storage buckets:
  - `profile-photos` - For user avatars and profile images (public)
  - `resumes` - For resume PDFs (public for job seekers)
  - `payment-screenshots` - For payment proof uploads (private, admin only)
  - `verification-documents` - For identity verification (private, admin only)
  - `banner-logos` - For salon banners (public)
  - `salon-gallery` - For salon gallery images (public)

- Configure Row Level Security (RLS) policies for each bucket

### 2. Required Tables

Ensure these tables exist in your Supabase database. They should be created by `create-database-schema.sql`:

- `job_seekers` - With user profiles
- `salon_owners` - With salon information
- `admin_users` - With admin records

### 3. Verify Setup

Check that buckets are created:
1. Go to Storage in Supabase dashboard
2. You should see 6 buckets listed

## File Organization

Files are organized by category in each bucket:

```
profile-photos/
  avatar/[timestamp-random].jpg
  portfolio/[timestamp-random].jpg

resumes/
  resume/[timestamp-random].pdf

payment-screenshots/
  payment/[timestamp-random].jpg

verification-documents/
  identity-proof/[timestamp-random].jpg
  passport-photo/[timestamp-random].jpg

banner-logos/
  banner/[timestamp-random].jpg

salon-gallery/
  gallery/[timestamp-random].jpg
```

## RLS Policies

### Public Buckets (profile-photos, resumes, banner-logos, salon-gallery)
- Anyone can read (SELECT)
- Authenticated users can upload their own files (INSERT in their folder)
- Users can delete only their own files (DELETE from their folder)

### Private Buckets (payment-screenshots, verification-documents)
- Only admin users can read (SELECT)
- Authenticated users can upload their own files (INSERT in their folder)
- Only admin users can delete (DELETE)

## Troubleshooting

### "Bucket already exists"
The migration uses `ON CONFLICT (id) DO NOTHING`, so running it multiple times is safe.

### "Permission denied" when uploading
Ensure:
1. User is authenticated
2. File path includes user ID as first folder: `{category}/{timestamp-random}.ext`
3. Bucket RLS policy allows the operation

### Files not visible after upload
1. Check bucket privacy setting (public vs private)
2. For private buckets, ensure user is admin (for payment-screenshots and verification-documents)
3. Verify RLS policies are correctly configured

## Environment Variables

Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # For API routes only
```

## Usage in Code

Use the upload functions in `lib/api/uploads.ts`:

```typescript
import { uploadAvatar, uploadResume, uploadPaymentScreenshot } from '@/lib/api/uploads';

// Upload a profile photo
const response = await uploadAvatar(file);
const publicUrl = response.url;

// Upload a resume
const response = await uploadResume(file);
const publicUrl = response.url;
const filePath = response.filePath;

// Delete a file
await deleteFile(filePath, 'resume');
```

## Next Steps

After setting up storage:
1. Configure database tables and RLS policies
2. Set up auth if not already done
3. Test file uploads from the application
