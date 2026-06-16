# Supabase Database Setup Instructions

This document explains how to set up the Supabase database for the SalonJobsIndia application.

## Prerequisites

- Supabase project created at https://supabase.com
- Access to Supabase SQL editor
- Storage buckets already created (see SUPABASE_STORAGE_SETUP.md)

## Setup Steps

### 1. Create Database Tables and RLS Policies

Run the SQL migration at `supabase/migrations/create-database-schema.sql` in your Supabase SQL editor:

1. Go to your Supabase project → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/migrations/create-database-schema.sql`
4. Click "Run"

This will create all required tables and configure Row Level Security (RLS) policies.

## Database Tables

### Core User Tables

#### job_seekers
- Job seekers looking for opportunities
- Fields: email, phone, name, profilePhoto, bio, location (lat/lon), city, area, state, pincode
- Fields: isVerified, isSubscribed, subscriptionExpiresAt
- Fields: profession, experience, skills[], resumeUrl

#### salon_owners
- Salon owners posting job listings
- Fields: email, phone, name, salonName, salonPhoto, salonAddress
- Fields: location (lat/lon), city, area, state, pincode, salonLogo
- Fields: isVerified, isSubscribed, subscriptionExpiresAt
- Fields: totalJobsPosted, totalJobsActive

#### admin_users
- Admin users for approvals and moderation
- Fields: email, name, role, createdAt, updatedAt

### Business Tables

#### jobs
- Job listings posted by salon owners
- Fields: title, category, description, location, salary
- Fields: experienceRequired, requiredSkills[], jobType
- Fields: status (draft/pending/live/expired/closed)
- Fields: paymentId, paymentApprovedAt, approvedAt
- Fields: viewsCount, applicationsCount
- Relationships: References salon_owners(id)

#### applications
- Applications from job seekers to job listings
- Fields: jobId, jobSeekerId, resumeUrl, coverLetter
- Fields: status (applied/reviewing/rejected/accepted)
- Fields: appliedAt, reviewedAt
- Relationships: References jobs(id), job_seekers(id)

#### subscriptions
- Subscription payments and status
- Fields: userId, userPhone, userName, userRole
- Fields: planType, planName, amount
- Fields: status (pending/approved/rejected/expired)
- Fields: screenshotUrl, transactionId, paymentMethod
- Fields: jobPostsTotal, jobPostsUsed, contactCredits
- Fields: createdAt, approvedAt, expiresAt

#### payments
- Payment records for various services
- Fields: userId, userName, userPhone
- Fields: type (job_publishing/verified_badge/contact_pack)
- Fields: amount, status, screenshotUrl, transactionId
- Fields: jobId, resumeId, contactCredits
- Fields: validityDays, submittedAt, processedAt

#### credits
- Credit system for job seekers/owners
- Fields: userId, creditsAvailable, creditsUsed
- Fields: creditType (contact_unlock, job_post, banner)
- Fields: expiresAt, createdAt

#### credit_transactions
- History of credit usage
- Fields: creditId, userId, amount
- Fields: transactionType (add/deduct/expire)
- Fields: reason, relatedJobId, relatedUserId
- Fields: createdAt

#### admin_actions
- Audit log of admin actions
- Fields: adminId, actionType, targetTable, targetId
- Fields: oldValue, newValue, reason
- Fields: createdAt

#### notifications
- User notifications
- Fields: userId, type, title, message
- Fields: relatedJobId, relatedUserId
- Fields: isRead, readAt, createdAt

#### locations
- Cached location data for faster queries
- Fields: city, area, state, pincode
- Fields: latitude, longitude, jobCount, salonCount
- Fields: updatedAt

#### banners
- Salon promotional banners
- Fields: salonOwnerId, logoUrl, title, description
- Fields: isActive, expiresAt, priority
- Fields: createdAt, updatedAt

## Row Level Security (RLS) Policies

### job_seekers Table

**SELECT Policy:**
- Anyone can read public profiles (SELECT)
- Users can see their own full profile

**INSERT Policy:**
- Authenticated users can create their own record

**UPDATE Policy:**
- Users can update only their own profile
- Admins can update any profile

**DELETE Policy:**
- Users can delete their own account
- Admins can delete any account

### salon_owners Table

**SELECT Policy:**
- Anyone can read salon profiles (limited fields)
- Users can see their own full profile

**INSERT Policy:**
- Authenticated users can create their own record

**UPDATE Policy:**
- Users can update only their own salon profile
- Admins can update any profile

**DELETE Policy:**
- Users can delete their own salon
- Admins can delete any salon

### jobs Table

**SELECT Policy:**
- Everyone can read live jobs
- Job owners can see their draft jobs
- Admins can see all jobs

**INSERT Policy:**
- Authenticated salon owners can create jobs

**UPDATE Policy:**
- Job owners can update their own jobs
- Admins can update any job

**DELETE Policy:**
- Job owners can delete their own jobs
- Admins can delete any job

### applications Table

**SELECT Policy:**
- Job seekers can see their own applications
- Job owners can see applications on their jobs
- Admins can see all applications

**INSERT Policy:**
- Authenticated job seekers can apply for jobs

**UPDATE Policy:**
- Job seekers can update their own applications
- Job owners can update applications on their jobs (status)
- Admins can update any application

**DELETE Policy:**
- Job seekers can delete their own applications
- Admins can delete any application

### subscriptions Table

**SELECT Policy:**
- Users can see their own subscription
- Admins can see all subscriptions

**INSERT Policy:**
- Authenticated users can create subscription request

**UPDATE Policy:**
- Admins can approve/reject subscriptions
- Users cannot modify after creation

**DELETE Policy:**
- Admins can delete subscription records

### payments Table

**SELECT Policy:**
- Users can see their own payments
- Admins can see all payments

**INSERT Policy:**
- Authenticated users can create payment records

**UPDATE Policy:**
- Admins can approve/reject payments
- Users cannot modify after submission

### admin_actions Table

**SELECT Policy:**
- Only admins can read the audit log

**INSERT Policy:**
- System can insert admin actions
- Admins can create actions

## Indexes

For better performance, these indexes should be created:

```sql
CREATE INDEX idx_job_seekers_email ON job_seekers(email);
CREATE INDEX idx_job_seekers_city ON job_seekers(city);
CREATE INDEX idx_job_seekers_location ON job_seekers USING GIST(ll_to_earth(latitude, longitude));

CREATE INDEX idx_salon_owners_email ON salon_owners(email);
CREATE INDEX idx_salon_owners_city ON salon_owners(city);
CREATE INDEX idx_salon_owners_location ON salon_owners USING GIST(ll_to_earth(latitude, longitude));

CREATE INDEX idx_jobs_salonOwnerId ON jobs(salonOwnerId);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_createdAt ON jobs(createdAt DESC);
CREATE INDEX idx_jobs_location ON jobs USING GIST(ll_to_earth(latitude, longitude));

CREATE INDEX idx_applications_jobId ON applications(jobId);
CREATE INDEX idx_applications_jobSeekerId ON applications(jobSeekerId);
CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_subscriptions_userId ON subscriptions(userId);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_payments_userId ON payments(userId);
CREATE INDEX idx_payments_status ON payments(status);
```

## Environment Variables

Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Verification

After running the migration:

1. Check Tables tab in Supabase dashboard - should see all tables listed
2. Check Auth tab - verify authentication is enabled
3. Run a test query to verify RLS is working:

```sql
SELECT * FROM job_seekers LIMIT 1;
```

## Troubleshooting

### "Table already exists"
The migration uses `IF NOT EXISTS`, so running it multiple times is safe.

### "Permission denied" errors
- Ensure auth is set up properly
- Check that RLS policies are correctly configured
- Verify user authentication tokens are valid

### Slow queries
- Run the indexes creation script
- Monitor query performance in Supabase dashboard

## Next Steps

After setting up database:
1. Set up Storage buckets (see SUPABASE_STORAGE_SETUP.md)
2. Configure authentication
3. Test file uploads and database queries
4. Set up realtime subscriptions if needed

## API Usage

The app uses these tables through:

**Client-side queries:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Query jobs
const { data: jobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'live')
  .gte('expiresAt', new Date());

// Apply for a job
const { data: application } = await supabase
  .from('applications')
  .insert({
    jobId,
    jobSeekerId: currentUser.id,
    resumeUrl,
    status: 'applied'
  });
```

**Server-side queries:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, serviceKey);

// Admin action - approve payment
const { data: payment } = await supabase
  .from('payments')
  .update({ status: 'approved', processedAt: now() })
  .eq('id', paymentId);
```
