# Hostinger SFTP Storage - Testing & Deployment Guide

## Pre-Deployment Checklist

- [ ] Hostinger SFTP credentials obtained
- [ ] Upload folders created on Hostinger (/uploads/*)
- [ ] Environment variables set in Vercel
- [ ] Supabase file_uploads table migrated
- [ ] Local .env.local configured
- [ ] Build passing with no errors
- [ ] All upload functions tested locally

## Local Testing (Before Deployment)

### 1. Configure Local Environment

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HOSTINGER_SFTP_HOST=sftp.hostinger.com
HOSTINGER_SFTP_PORT=22
HOSTINGER_SFTP_USERNAME=u123456789
HOSTINGER_SFTP_PASSWORD=your_password
HOSTINGER_PUBLIC_URL=https://yourdomain.com
```

### 2. Run Local Dev Server

```bash
npm run dev
# or
pnpm dev
```

### 3. Test Resume Upload

1. Navigate to Job Seeker Dashboard
2. Go to "Build Resume" section
3. Fill in basic info
4. Upload a test PDF resume
5. Check browser console for upload logs
6. Verify file appears in Hostinger File Manager → /uploads/resumes/
7. Refresh page - resume URL should still be accessible

**Expected result:** File visible in Hostinger + URL in Supabase file_uploads table

### 4. Test Profile Photo Upload

1. Go to Job Seeker Profile section
2. Upload a JPEG/PNG image as profile photo
3. Check browser console logs
4. Verify file in Hostinger → /uploads/profile-photos/
5. Image should display immediately on profile

**Expected result:** Profile photo displays without refresh

### 5. Test Payment Screenshot Upload

1. Go to Salon Owner → Payment section
2. Upload a payment screenshot
3. Check Hostinger → /uploads/payment-screenshots/
4. Verify screenshot is accessible

**Expected result:** Admin can view screenshot for approval

### 6. Test File Deletion

1. Upload any test file
2. Note the file path from console or Supabase
3. Use the delete functionality
4. Verify file removed from Hostinger
5. Verify metadata removed from Supabase

**Expected result:** File completely removed from both locations

## Deployment to Vercel

### Step 1: Set Environment Variables

In Vercel Project Settings → Environment Variables:

```
HOSTINGER_SFTP_HOST: sftp.hostinger.com
HOSTINGER_SFTP_PORT: 22
HOSTINGER_SFTP_USERNAME: u123456789
HOSTINGER_SFTP_PASSWORD: ****** (use secret)
HOSTINGER_PUBLIC_URL: https://yourdomain.com
```

### Step 2: Deploy

```bash
git add .
git commit -m "chore: add Hostinger SFTP storage integration"
git push origin main
```

Vercel will automatically deploy. Monitor deployment logs for any errors.

### Step 3: Run Database Migration

Execute the SQL migration in Supabase:

1. Go to Supabase SQL Editor
2. Paste contents of `supabase/migrations/add-file-uploads-table.sql`
3. Click "Run"
4. Verify `file_uploads` table created with RLS policies

## Post-Deployment Testing

### Test 1: Resume Upload (Production)

1. Visit production URL
2. Register as job seeker
3. Build and upload resume
4. Verify file appears on Hostinger server
5. Resume should be downloadable
6. Download and verify file integrity

### Test 2: Payment Screenshot (Admin Review)

1. Register as salon owner
2. Upload payment screenshot for subscription
3. Login as admin
4. View pending payment
5. Click to open screenshot
6. Image should load correctly

### Test 3: Performance Check

Monitor upload performance:
- Test with 5MB file (should upload in <2 seconds)
- Test with 10MB file (should upload smoothly)
- Check Vercel function logs for timeout issues

### Test 4: Error Handling

Test error scenarios:
- Upload with bad credentials (should show clear error)
- Upload file > 10MB (should reject with message)
- Upload unsupported file type (should reject)
- Network disconnect during upload (should handle gracefully)

### Test 5: File Persistence

1. Upload file
2. Clear browser cache
3. Refresh page
4. File URL should still work
5. Verify file still exists on Hostinger 30 days later

### Test 6: Admin Dashboard

1. Login as admin
2. View pending payments
3. Click to view payment screenshots
4. Verify all images load correctly

## Monitoring & Maintenance

### Check Hostinger Storage

Regularly check Hostinger File Manager for:
- Disk space usage
- Old files to archive
- File organization
- Access logs

### Monitor Vercel Function Logs

Check for upload errors:

```bash
vercel logs --team your-team
```

Look for patterns:
- Connection timeouts
- SFTP errors
- File size issues

### Monitor Supabase

Check for failed uploads:

```sql
SELECT COUNT(*) FROM file_uploads 
WHERE DATE(uploaded_at) = TODAY()
GROUP BY category;
```

## Troubleshooting

### Issue: "SFTP connection failed"

**Cause:** Invalid credentials or SFTP server unreachable

**Solution:**
1. Verify SFTP credentials in Vercel environment
2. Test SFTP connection manually with FileZilla
3. Check Hostinger SFTP account is active
4. Verify port 22 or 2222 is not blocked

### Issue: "Upload timeout"

**Cause:** Large file or slow connection

**Solution:**
1. Reduce max file size in `app/api/upload/route.ts` if needed
2. Increase Vercel function timeout (currently 60 seconds)
3. Check Hostinger server response time

### Issue: Files not persisting after refresh

**Cause:** URL not saved properly to Supabase

**Solution:**
1. Check Supabase file_uploads table
2. Verify RLS policies allow reads
3. Check browser network tab for 403 errors

### Issue: Old Blob URLs still working

**Cause:** Old Supabase Storage buckets still exist

**Solution:**
1. Delete old Supabase Storage buckets
2. Clear Cloudflare cache if using
3. Wait for DNS cache to clear

## Performance Optimization

### Reduce Upload Time

- Max file size: 10MB (currently set)
- Accepted formats: JPEG, PNG, WebP, PDF
- Compression recommended for images
- Consider adding image optimization on upload

### Reduce File Size

Add image compression before upload:

```typescript
import imageCompression from 'browser-image-compression'

const options = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true
}
const compressedFile = await imageCompression(file, options)
```

### Add Upload Progress

Update components to show upload progress:

```typescript
const onProgress = (progress: number) => {
  setUploadProgress(progress)
  console.log(`Upload ${progress}% complete`)
}
await uploadAvatar(file, userId, onProgress)
```

## Rollback Plan

If Hostinger SFTP stops working:

1. Revert to Supabase Storage:
   - Update `app/api/upload/route.ts` to use Supabase
   - Restore old upload bucket configuration
   - Deploy changes

2. Migrate files back:
   - Export file metadata from Supabase
   - Use SFTP to backup all files
   - Re-upload to Supabase Storage bucket

3. Update frontend:
   - Update URLs to point to Supabase again
   - Test all upload workflows

## Support & Escalation

### Hostinger Issues
- Contact Hostinger support: support.hostinger.com
- Provide: SFTP username, error message, file size

### Vercel Issues
- Check deployment logs
- Verify environment variables set correctly
- Contact Vercel support if deployment fails

### Supabase Issues
- Check SQL migration ran successfully
- Verify RLS policies in place
- Check table permissions

## Final Checklist Before Production

- [ ] All environment variables set in Vercel
- [ ] Supabase migration complete
- [ ] Local testing passed
- [ ] Staging environment tested
- [ ] Error handling working correctly
- [ ] Hostinger storage usage monitored
- [ ] Backup plan documented
- [ ] Team trained on new upload system
- [ ] Monitoring and alerts configured
- [ ] Rollback procedure tested
