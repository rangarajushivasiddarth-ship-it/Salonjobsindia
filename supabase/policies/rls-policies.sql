-- Supabase RLS Policies for SalonJobsIndia
-- These policies enforce row-level security for all tables
-- Enable RLS on all tables first, then apply these policies

-- ============================================================================
-- JOB SEEKERS TABLE
-- ============================================================================

-- Job seekers can read their own profile
CREATE POLICY "job_seekers_read_own_profile" ON job_seekers
FOR SELECT
USING (auth.uid() = id);

-- Job seekers can update their own profile
CREATE POLICY "job_seekers_update_own_profile" ON job_seekers
FOR UPDATE
USING (auth.uid() = id);

-- Admin can read all job seekers
CREATE POLICY "admin_read_all_job_seekers" ON job_seekers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- SALON OWNERS TABLE
-- ============================================================================

-- Salon owners can read their own profile
CREATE POLICY "salon_owners_read_own_profile" ON salon_owners
FOR SELECT
USING (auth.uid() = id);

-- Salon owners can update their own profile
CREATE POLICY "salon_owners_update_own_profile" ON salon_owners
FOR UPDATE
USING (auth.uid() = id);

-- Admin can read all salon owners
CREATE POLICY "admin_read_all_salon_owners" ON salon_owners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- JOBS TABLE
-- ============================================================================

-- Job seekers can read only live jobs
CREATE POLICY "job_seekers_read_live_jobs" ON jobs
FOR SELECT
USING (
  status = 'live' AND 
  expiresAt > now() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'job_seeker'
);

-- Salon owners can read their own jobs
CREATE POLICY "salon_owners_read_own_jobs" ON jobs
FOR SELECT
USING (
  ownerId = auth.uid() OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Salon owners can insert jobs
CREATE POLICY "salon_owners_insert_jobs" ON jobs
FOR INSERT
WITH CHECK (
  ownerId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

-- Salon owners can update their own jobs
CREATE POLICY "salon_owners_update_own_jobs" ON jobs
FOR UPDATE
USING (
  ownerId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

-- Job seekers can read their own applications
CREATE POLICY "job_seekers_read_own_applications" ON applications
FOR SELECT
USING (
  seekerId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'job_seeker'
);

-- Job seekers can create applications
CREATE POLICY "job_seekers_insert_applications" ON applications
FOR INSERT
WITH CHECK (
  seekerId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'job_seeker'
);

-- Salon owners can read applications for their jobs
CREATE POLICY "salon_owners_read_job_applications" ON applications
FOR SELECT
USING (
  jobId IN (
    SELECT id FROM jobs WHERE ownerId = auth.uid()
  )
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

-- Salon owners can read their own subscription
CREATE POLICY "salon_owners_read_own_subscription" ON subscriptions
FOR SELECT
USING (
  userId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

-- Admin can read all subscriptions
CREATE POLICY "admin_read_all_subscriptions" ON subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

-- Users can read their own payments
CREATE POLICY "users_read_own_payments" ON payments
FOR SELECT
USING (userId = auth.uid());

-- Admin can read all payments
CREATE POLICY "admin_read_all_payments" ON payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Only admin can update payments
CREATE POLICY "admin_update_payments" ON payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- CREDITS TABLE
-- ============================================================================

-- Salon owners can read their own credits
CREATE POLICY "salon_owners_read_own_credits" ON credits
FOR SELECT
USING (
  userId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

-- ============================================================================
-- CONTACT UNLOCKS TABLE
-- ============================================================================

-- Salon owners can read their own unlocks
CREATE POLICY "salon_owners_read_own_unlocks" ON contact_unlocks
FOR SELECT
USING (
  salonOwnerId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

-- Salon owners can create unlocks (using credits)
CREATE POLICY "salon_owners_insert_unlocks" ON contact_unlocks
FOR INSERT
WITH CHECK (
  salonOwnerId = auth.uid() AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Resumes bucket
-- Job seekers can upload their own resumes
CREATE POLICY "job_seekers_upload_resume" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Salon owners can read resumes when contact is unlocked
CREATE POLICY "salon_owners_read_resumes" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM contact_unlocks
    WHERE contact_unlocks.salonOwnerId = auth.uid()
    AND contact_unlocks.jobSeekerId = auth.uid()::text
  )
);

-- Profile photos bucket
CREATE POLICY "users_upload_profile_photo" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "public_read_profile_photos" ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- Payment screenshots bucket
CREATE POLICY "users_upload_payment_screenshot" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "admin_read_payment_screenshots" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Verification documents bucket
CREATE POLICY "users_upload_verification" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Banner logos bucket
CREATE POLICY "salon_owners_upload_banner" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'banner-logos' AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

CREATE POLICY "public_read_banners" ON storage.objects
FOR SELECT
USING (bucket_id = 'banner-logos');

-- Salon gallery bucket
CREATE POLICY "salon_owners_upload_gallery" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'salon-gallery' AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'salon_owner'
);

CREATE POLICY "public_read_salon_gallery" ON storage.objects
FOR SELECT
USING (bucket_id = 'salon-gallery');
