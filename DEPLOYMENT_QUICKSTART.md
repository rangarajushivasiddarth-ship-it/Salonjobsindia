# Quick Start - Deployment to Hostinger

## Step 1: Set Up Supabase Project (5 minutes)

1. Go to https://supabase.com and create/select your project
2. Copy these from your project settings:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Create Database Tables & Buckets (5 minutes)

### In Supabase SQL Editor:
1. Go to SQL Editor → New Query
2. Copy entire contents of: `supabase/migrations/create-database-schema.sql`
3. Click Run
4. Wait for success message

### In Supabase SQL Editor again:
1. Go to SQL Editor → New Query
2. Copy entire contents of: `supabase/migrations/setup-storage-buckets.sql`
3. Click Run
4. Wait for success message

### Verify:
- Go to Storage tab → Should see 6 buckets listed
- Go to Tables tab → Should see job_seekers, salon_owners, jobs, etc.

## Step 3: Deploy to Hostinger

### Build the Project:
```bash
npm install
npm run build
```

### Push to Hostinger (choose one):

**Option A: Via Git**
```bash
git push
# Hostinger will auto-deploy if connected
```

**Option B: Via FTP/SFTP**
1. Build locally: `npm run build`
2. Upload `.next/` folder to Hostinger
3. Set environment variables via Hostinger dashboard

### Set Environment Variables in Hostinger:
In your Hostinger project settings, add:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Step 4: Test Critical Flows

### Test 1: Job Seeker Free Registration
1. Go to registration page
2. Select "Job Seeker" role
3. Fill form and submit
4. **Expected**: Instant success, can access jobs immediately (NO payment screen)

### Test 2: Salon Owner Registration
1. Go to registration page
2. Select "Salon Owner" role
3. Fill form and submit
4. **Expected**: Success, redirected to payment
5. After admin approval, can post jobs

### Test 3: File Upload - Profile Photo
1. Register as job seeker
2. Go to Profile → Upload Photo
3. **Expected**: Photo appears in profile, persists after logout/login

### Test 4: Location Detection
1. Go to registration
2. Allow location permission
3. **Expected**: City/Area auto-fills from coordinates

### Test 5: Admin Approvals
1. Login as admin
2. Go to Admin Dashboard
3. See pending payments with screenshots
4. Can view, approve, reject
5. **Expected**: Private files load correctly

## File Upload Workflow

### How uploads work:
1. User uploads file (e.g., resume)
2. Client validates file (type, size)
3. Client sends to `/api/upload`
4. Server uploads to Supabase Storage
5. Public URL returned
6. URL saved in database
7. File persists across all sessions

### Storage buckets:
- **Public** (anyone can read): profile-photos, resumes, banner-logos, salon-gallery
- **Private** (admin only): payment-screenshots, verification-documents

## Location Detection Workflow

1. User enters registration
2. Browser requests location permission
3. If granted:
   - Gets latitude/longitude
   - Reverse geocodes to city/state/pincode
   - Auto-fills form
   - Saves to profile
4. If denied:
   - Shows manual entry field
   - User types location

## Admin Dashboard Tasks

After deployment, admin should:

1. **Create admin account** in Supabase:
   ```sql
   INSERT INTO admin_users (email, name, role)
   VALUES ('admin@salonjobs.com', 'Admin', 'admin');
   ```

2. **Approve payments**:
   - Check new subscription requests
   - Verify payment screenshots
   - Approve/reject subscriptions
   - This activates salon owner accounts

3. **Monitor jobs**:
   - View pending job posts
   - Approve/reject flagged jobs
   - Check job applications

## Troubleshooting

### "Supabase credentials not configured"
→ Check environment variables are set in Hostinger

### "Permission denied" on file upload
→ Ensure RLS policies are applied (run the setup-storage-buckets.sql)

### Location not auto-detecting
→ Ensure HTTPS is used (Hostinger provides this by default)
→ Check browser geolocation permission

### Admin can't see payment screenshots
→ Verify SUPABASE_SERVICE_ROLE_KEY is set
→ Check that admin_users table has your admin email

## Performance Tips

1. **Enable Supabase Caching**:
   - Go to Supabase → Database → Replication
   - Enable replication for frequently queried tables

2. **Add Database Indexes**:
   ```sql
   CREATE INDEX idx_jobs_city ON jobs(city);
   CREATE INDEX idx_job_seekers_city ON job_seekers(city);
   ```

3. **Monitor Storage**:
   - Check Supabase Storage usage in Settings
   - Configure storage limits if needed

## Monitoring Checklist

- [ ] Database connections working
- [ ] File uploads to storage working
- [ ] Admin can see payment screenshots
- [ ] Location detection working
- [ ] Job seeker free registration working
- [ ] Salon owner paid workflow working
- [ ] Admin approvals working
- [ ] Jobs visible to job seekers after approval

## Support

**Documentation Files**:
- `SUPABASE_DATABASE_SETUP.md` - Database schema details
- `SUPABASE_STORAGE_SETUP.md` - Storage configuration
- `PRODUCTION_AUDIT_COMPLETED.md` - Complete audit summary

**Emergency Reset** (if needed):
1. Go to Supabase → Settings → Danger Zone → Reset Project
2. Re-run the migration SQL files
3. Re-check environment variables

---

**Deployment Time**: ~30 minutes
**Estimated**: 15 min setup + 10 min migrations + 5 min testing
