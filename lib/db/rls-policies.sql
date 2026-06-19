-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR SALONJOBSINDIA
-- ============================================================================
-- CRITICAL: Run these SQL statements in your Supabase SQL Editor
-- These policies ensure users can only access their own data
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_view_own" ON users
  FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- System can create new users (for signup)
CREATE POLICY "users_insert_public" ON users
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. JOB_SEEKERS TABLE
-- ============================================================================
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;

-- Job seekers can view their own profile
CREATE POLICY "job_seekers_view_own" ON job_seekers
  FOR SELECT USING (auth.uid()::text = user_id);

-- Job seekers can update their own profile
CREATE POLICY "job_seekers_update_own" ON job_seekers
  FOR UPDATE USING (auth.uid()::text = user_id);

-- System can create job seeker profiles
CREATE POLICY "job_seekers_insert_public" ON job_seekers
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 3. SALON_PROFILES TABLE
-- ============================================================================
ALTER TABLE salon_profiles ENABLE ROW LEVEL SECURITY;

-- Salon owners can view their own profile
CREATE POLICY "salon_profiles_view_own" ON salon_profiles
  FOR SELECT USING (auth.uid()::text = owner_id);

-- Salon owners can update their own profile
CREATE POLICY "salon_profiles_update_own" ON salon_profiles
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- System can create salon profiles
CREATE POLICY "salon_profiles_insert_public" ON salon_profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 4. JOBS TABLE
-- ============================================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Salon owners can view their own jobs
CREATE POLICY "jobs_view_own" ON jobs
  FOR SELECT USING (auth.uid()::text = owner_id);

-- Salon owners can insert new jobs
CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

-- Salon owners can update their own jobs
CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- Salon owners can delete their own jobs
CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE USING (auth.uid()::text = owner_id);

-- Job seekers can view approved jobs (for job search)
CREATE POLICY "jobs_view_approved_public" ON jobs
  FOR SELECT USING (status = 'APPROVED' AND is_visible = true);

-- ============================================================================
-- 5. SUBSCRIPTIONS TABLE
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "subscriptions_view_own" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own subscriptions
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- ============================================================================
-- 6. PAYMENTS TABLE
-- ============================================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "payments_view_own" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own payments
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 7. APPLICATIONS TABLE (if it exists)
-- ============================================================================
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Job seekers can view their own applications
-- CREATE POLICY "applications_view_own" ON applications
--   FOR SELECT USING (auth.uid()::text = job_seeker_id);

-- Job seekers can insert their own applications
-- CREATE POLICY "applications_insert_own" ON applications
--   FOR INSERT WITH CHECK (auth.uid()::text = job_seeker_id);

-- Salon owners can view applications to their jobs
-- CREATE POLICY "applications_view_own_jobs" ON applications
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM jobs WHERE jobs.id = applications.job_id 
--       AND jobs.owner_id = auth.uid()::text
--     )
--   );

-- ============================================================================
-- 8. ADMIN ACCESS (Optional: for admin panel)
-- ============================================================================
-- If you have an admin table or admin role, use this:
-- 
-- CREATE POLICY "admin_all_access" ON jobs
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM admins WHERE admins.user_id = auth.uid()::text
--     )
--   );
-- 
-- This gives admins full access to jobs for moderation

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running these policies, verify they're enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

-- To view all RLS policies:
-- SELECT * FROM pg_policies;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If a policy is too restrictive:
-- 1. Check that users are authenticated with correct user IDs
-- 2. Verify auth.uid() returns the correct UUID
-- 3. Test policies with: EXPLAIN (ANALYZE) SELECT * FROM table_name;
--
-- If you need to disable RLS temporarily for debugging:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
--
-- To drop a policy:
-- DROP POLICY "policy_name" ON table_name;
