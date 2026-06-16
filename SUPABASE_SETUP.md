# Supabase Setup Guide for SalonJobsIndia

## Complete Setup Checklist

This guide walks through setting up Supabase with all required tables, storage buckets, and RLS policies.

### Setup Order:
1. **Create Database Tables** (this runs all table schemas and RLS policies)
2. **Create Storage Buckets** (this creates file upload storage with RLS)
3. **Verify Environment Variables** (ensure all keys are in your project)

---

## Step 1: Create Database Tables & RLS Policies

Run the SQL migration in `supabase/migrations/create-database-schema.sql`:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/migrations/create-database-schema.sql`
4. Click **Run**

### What This Does:

Creates 10 tables with full RLS policies:
- **admin_users** - Admin accounts
- **job_seekers** - Job seeker profiles
- **salon_owners** - Salon owner profiles  
- **jobs** - Job postings
- **applications** - Job applications
- **subscriptions** - User subscriptions
- **payments** - Payment records
- **notifications** - User notifications
- **locations** - Geolocation data
- **admin_actions** - Audit logs

### RLS Policy Summary:

| Table | Job Seekers | Salon Owners | Admins |
|-------|-------------|--------------|--------|
| job_seekers | Read/Update own | - | Read all |
| salon_owners | - | Read/Update own | Read all |
| jobs | Read live | Read/Write own | Read all |
| applications | Read own, Create | Read own jobs' apps | Read all |
| subscriptions | Read own | Read own | Read all |
| payments | Read/Create own | - | Read/Update all |
| notifications | Read/Update own | Read/Update own | - |
| locations | Read/Create/Update own | Read/Create/Update own | Read all |
| admin_actions | - | - | Read/Create all |

---

## Step 2: Create Storage Buckets with RLS

Run the SQL migration in `supabase/migrations/setup-storage-buckets.sql`:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/migrations/setup-storage-buckets.sql`
4. Click **Run**

### Buckets Created:

| Bucket | Public? | Access | Use Case |
|--------|---------|--------|----------|
| profile-photos | Yes | Users upload own, anyone reads | Job seeker profile pictures |
| resumes | Yes | Users upload own, anyone reads | Job seeker resumes (PDF) |
| payment-screenshots | No | Users upload, admins read/delete | Payment proof for approval |
| verification-documents | No | Users upload, admins read/delete | ID/certificate verification |
| banner-logos | Yes | Owners upload, anyone reads | Salon branding logos |
| salon-gallery | Yes | Owners upload, anyone reads | Salon service photos |

---

## Step 3: Set Up Admin Users

Your first admin account must be created manually:

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Create a new user with an email and password
4. Copy their **User ID** (UUID)
5. Go back to **SQL Editor**
6. Run this query (replace {USER_ID} with the UUID):

```sql
INSERT INTO admin_users (id, email, name, role)
VALUES ('{USER_ID}', 'admin@example.com', 'Admin', 'admin')
ON CONFLICT (id) DO NOTHING;
```

---

## Step 4: Verify Environment Variables

Check that all these environment variables are set in your Vercel/Hostinger project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POSTGRES_URL=postgresql://...
```

Find these values:
- **URL & Anon Key**: Supabase Dashboard → Settings → API
- **Service Role Key**: Supabase Dashboard → Settings → API (scroll down)
- **POSTGRES_URL**: Supabase Dashboard → Settings → Database

---

## File Upload Structure

All uploads organize files by user ID in subdirectories:

```
profile-photos/
  └── {user-id}/
      └── 1718555123456-abc123.jpg

resumes/
  └── {user-id}/
      └── 1718555789012-xyz789.pdf

payment-screenshots/
  └── {user-id}/
      └── 1718556012345-qwerty.png
```

---

## Upload Usage

### From Next.js Client:

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('category', 'profile-photo') // or 'resume', 'payment-screenshot', etc.
formData.append('userId', currentUserId)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const { url, path, bucket } = await response.json()
// url: Public URL for accessing file (for public buckets)
// path: File path in bucket (for deletion)
// bucket: Bucket name
```

### Download/Access Files:

**Public buckets** (profile-photos, resumes, banner-logos, salon-gallery):
```
https://your-project.supabase.co/storage/v1/object/public/{bucket}/{path}
```

**Private buckets** (payment-screenshots, verification-documents):
- Restricted to admins only
- Must use signed URLs or authenticated requests

---

## Troubleshooting

### "Access Denied" on Upload
- ✓ Check that user is authenticated
- ✓ Verify file is in the correct category
- ✓ Ensure folder path includes user ID
- ✓ Wait 30 seconds for RLS policy cache to clear

### Can't See Live Jobs
- ✓ Check job status is 'live' (not 'draft')
- ✓ Verify job isActive is true
- ✓ Job may have already expired (check expiresAt)

### Payments Not Showing in Admin
- ✓ Verify user ID is in admin_users table
- ✓ Check payment status is correct
- ✓ Wait 30 seconds for RLS policy cache to clear

### User Keeps Getting Logged Out
- ✓ Check NEXT_PUBLIC_SUPABASE_URL is correct
- ✓ Verify session storage is working in browser (check localStorage)
- ✓ Ensure auth middleware isn't blocking requests

---

## Next Steps

After setup:
1. ✓ Test user registration/login
2. ✓ Test job seeker free registration  
3. ✓ Test file uploads (photo, resume)
4. ✓ Test location detection
5. ✓ Test payment workflow (screenshot upload → admin approval)
6. ✓ Test geolocation-based job search

---

## Security Best Practices

1. **RLS is Enabled** - All tables have row-level security
2. **File Isolation** - Users can only access their own files
3. **Admin-Only Access** - Payment screenshots & verification docs only visible to admins
4. **Public Storage** - Profile photos, resumes, logos, gallery are publicly readable
5. **Signed URLs** - Private files should use 1-hour expiration signed URLs
6. **API Security** - All uploads validated on server-side

---

## Schema Diagrams

### User Registration Flow:
```
User Signs Up
  ↓
Supabase Auth Creates User
  ↓
SELECT (job_seeker OR salon_owner)
  ↓
CREATE Profile Record
  ↓
Profile Ready
```

### Job Posting Flow:
```
Salon Owner Creates Job (Draft)
  ↓
Upload Payment Screenshot
  ↓
Payment Submitted (Pending)
  ↓
Admin Reviews Payment → Approve
  ↓
Job Set to Live
  ↓
Job Visible to Job Seekers
```

### Job Application Flow:
```
Job Seeker Applies for Job
  ↓
Application Record Created
  ↓
Salon Owner Reviews Application
  ↓
Salon Owner Updates Status
  ↓
Notification Sent to Job Seeker
```

---

## Support

For Supabase-specific help:
- Documentation: https://supabase.com/docs
- Community: https://discord.supabase.io
- Status: https://status.supabase.com
