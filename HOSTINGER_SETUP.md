# Hostinger SFTP Storage Setup Guide

## Overview
Your SalonJobsIndia app now uses Hostinger's SFTP storage for persistent file uploads. All files are stored on your Hostinger server and metadata is tracked in Supabase.

## Architecture
```
Frontend Upload
    ↓
Vercel API Route (/api/upload)
    ↓
Hostinger SFTP Server (stores files)
    ↓
Supabase Database (stores metadata)
    ↓
Public URL returned to frontend
```

## Prerequisites
- Active Hostinger account with SFTP access
- SFTP credentials (hostname, username, password)
- Supabase project set up
- Vercel environment variables configured

## Step 1: Get Hostinger SFTP Credentials

1. Log in to your Hostinger account
2. Navigate to **File Manager** or **FTP Accounts**
3. Create or locate your SFTP account
4. Note down:
   - **SFTP Hostname** (e.g., `sftp.hostinger.com` or your domain)
   - **SFTP Port** (typically 22, sometimes 2222)
   - **SFTP Username** (e.g., `u123456789`)
   - **SFTP Password** (your SFTP password)

## Step 2: Create Upload Folders on Hostinger

Using any SFTP client (FileZilla, Cyberduck, WinSCP), connect to your Hostinger server and create these folders in your public_html or web root:

```
/uploads/
  ├── resumes/
  ├── profile-photos/
  ├── payment-screenshots/
  ├── verification-documents/
  ├── banners/
  └── salon-gallery/
```

**Permissions:** Set folder permissions to 755

## Step 3: Set Environment Variables on Vercel

Add these to your Vercel project settings:

```
HOSTINGER_SFTP_HOST=sftp.hostinger.com (or your SFTP hostname)
HOSTINGER_SFTP_PORT=22
HOSTINGER_SFTP_USERNAME=u123456789 (your SFTP username)
HOSTINGER_SFTP_PASSWORD=your_sftp_password
HOSTINGER_PUBLIC_URL=https://yourdomain.com (your public domain)
```

**IMPORTANT:** Never use `NEXT_PUBLIC_` for Hostinger credentials. These are server-side environment variables only.

## Step 4: Create Supabase File Uploads Table

Run the SQL migration to create the file metadata table:

```bash
supabase db push
```

Or manually run the SQL in `supabase/migrations/add-file-uploads-table.sql` in your Supabase SQL editor.

This creates:
- `file_uploads` table for storing file metadata
- Row-level security (RLS) policies
- Indexes for optimal performance

## Step 5: Update Environment Variables Locally

In your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HOSTINGER_SFTP_HOST=sftp.hostinger.com
HOSTINGER_SFTP_PORT=22
HOSTINGER_SFTP_USERNAME=u123456789
HOSTINGER_SFTP_PASSWORD=your_sftp_password
HOSTINGER_PUBLIC_URL=https://yourdomain.com
```

## Upload Flow

### 1. Job Seeker Profile Photo Upload
```typescript
import { uploadAvatar } from '@/lib/api/uploads'

const url = await uploadAvatar(file, userId)
// File saved to: /uploads/profile-photos/
// URL returned: https://yourdomain.com/uploads/profile-photos/...
// Metadata saved in Supabase file_uploads table
```

### 2. Job Seeker Resume Upload
```typescript
import { uploadResume } from '@/lib/api/uploads'

const url = await uploadResume(file, userId)
// File saved to: /uploads/resumes/
// URL returned: https://yourdomain.com/uploads/resumes/...
```

### 3. Salon Owner Payment Screenshot Upload
```typescript
import { uploadPaymentScreenshot } from '@/lib/api/uploads'

const url = await uploadPaymentScreenshot(file, userId)
// File saved to: /uploads/payment-screenshots/
// URL returned: https://yourdomain.com/uploads/payment-screenshots/...
// Admin can review for approval
```

### 4. Salon Gallery Image Upload
```typescript
import { uploadSalonGalleryImage } from '@/lib/api/uploads'

const url = await uploadSalonGalleryImage(file, userId)
// File saved to: /uploads/salon-gallery/
// URL returned: https://yourdomain.com/uploads/salon-gallery/...
```

## File Validation

All uploads are validated server-side:

- **File Types:** JPEG, PNG, WebP, PDF only
- **Max Size:** 10MB per file
- **Naming:** Safe filenames with user ID + timestamp + random ID
- **Security:** SFTP connection with secure credentials

## Supabase File Metadata Schema

The `file_uploads` table stores:

```
id (UUID) - Primary key
file_url (TEXT) - Public URL to access the file
file_path (TEXT) - Remote path on Hostinger
file_type (TEXT) - MIME type (image/jpeg, application/pdf, etc.)
category (TEXT) - Upload category (profile-photo, resume, etc.)
uploaded_by (UUID) - User ID who uploaded
file_size (INTEGER) - File size in bytes
uploaded_at (TIMESTAMP) - Upload timestamp
created_at (TIMESTAMP) - Record creation time
```

## Testing the Setup

### Test 1: Upload Resume
1. Go to Job Seeker Dashboard
2. Click "Upload Resume"
3. Select a PDF file
4. Wait for upload to complete
5. Check Hostinger File Manager → `/uploads/resumes/`
6. Verify file appears there with correct name
7. Refresh the page
8. Resume should still be accessible

### Test 2: Upload Payment Screenshot
1. Go to Salon Owner Payment Page
2. Upload a payment screenshot
3. Check Hostinger File Manager → `/uploads/payment-screenshots/`
4. Go to Admin Dashboard
5. Click to open the payment screenshot
6. Image should load correctly

### Test 3: Upload Banner
1. Go to Admin Settings
2. Upload banner/logo
3. Check Hostinger File Manager → `/uploads/banners/`
4. Verify banner appears on frontend

### Test 4: Verify No Broken Links
1. After uploads, refresh page
2. All files should load correctly
3. Check browser network tab - all file URLs should return 200 OK
4. No 404 errors

## Troubleshooting

### Issue: Upload fails with "SFTP connection failed"
- Check SFTP credentials in Vercel environment variables
- Verify SFTP port (22 or 2222)
- Ensure SFTP account is active in Hostinger

### Issue: Files not appearing on Hostinger
- Check folder permissions (should be 755)
- Verify upload folders exist
- Check file size limit

### Issue: "File too large" error
- Max file size is 10MB
- Reduce file size and try again

### Issue: Old Blob URLs still appearing
- Search codebase for `supabase.storage` references
- Update all component imports to use new `lib/api/uploads.ts`
- Clear browser cache

## Security Best Practices

1. **Never expose Hostinger credentials in frontend code**
   - Use server-side environment variables only
   - Never use `NEXT_PUBLIC_` prefix for SFTP password

2. **Validate all uploads server-side**
   - File type validation
   - File size limits
   - Safe filename generation

3. **Use SFTP over FTP**
   - SSH encryption for secure transfer
   - Never use unencrypted FTP

4. **Enable RLS on Supabase**
   - Users can only view/delete their own uploads
   - Admins can view/delete any upload

5. **Monitor Hostinger storage usage**
   - Set up automated cleanup for old files
   - Consider storage quota

## Migration from Blob Storage

All components using old Supabase Storage code have been updated to use the new Hostinger backend via the `/api/upload` route. The upload API endpoint remains the same (`/api/upload`), ensuring backward compatibility.

Old Supabase Storage buckets can be archived or deleted once migration is complete.

## Support

For issues with:
- **Hostinger SFTP:** Contact Hostinger support
- **Supabase setup:** Check Supabase documentation
- **Vercel deployment:** Check Vercel deployment logs
