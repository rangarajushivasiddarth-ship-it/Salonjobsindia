# DEPLOY ROW-LEVEL SECURITY NOW - 30 MINUTE TASK

## CRITICAL: Do This Before Production Launch

Row-Level Security (RLS) ensures users can ONLY see their own data. Without it, anyone could view other users' jobs, payments, and personal information.

---

## STEP 1: Access Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: SQL Editor (left sidebar)
4. Click: "New Query"

---

## STEP 2: ENABLE RLS ON ALL TABLES

Copy and run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs DISABLE ROW LEVEL SECURITY;  -- Admin only, no RLS needed

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected Output**: All tables should show `rowsecurity = true` (except sync_logs)

---

## STEP 3: CREATE POLICIES FOR USERS TABLE

```sql
-- Users can view their own profile
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- System can insert new users (for signup)
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (true);
```

**Verify**: 
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
-- Should show 3 policies
```

---

## STEP 4: CREATE POLICIES FOR SALON_PROFILES TABLE

```sql
-- Salon owners can view their own salon profile
DROP POLICY IF EXISTS "salon_profiles_select_own" ON salon_profiles;
CREATE POLICY "salon_profiles_select_own" ON salon_profiles
  FOR SELECT USING (auth.uid()::text = owner_id);

-- Salon owners can update their own profile
DROP POLICY IF EXISTS "salon_profiles_update_own" ON salon_profiles;
CREATE POLICY "salon_profiles_update_own" ON salon_profiles
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- System can create salon profiles
DROP POLICY IF EXISTS "salon_profiles_insert_own" ON salon_profiles;
CREATE POLICY "salon_profiles_insert_own" ON salon_profiles
  FOR INSERT WITH CHECK (true);
```

**Verify**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'salon_profiles';
-- Should show 3 policies
```

---

## STEP 5: CREATE POLICIES FOR JOBS TABLE

This is the MOST IMPORTANT - controls job visibility:

```sql
-- Salon owners can view their own jobs
DROP POLICY IF EXISTS "jobs_select_own" ON jobs;
CREATE POLICY "jobs_select_own" ON jobs
  FOR SELECT USING (auth.uid()::text = owner_id);

-- Salon owners can insert jobs
DROP POLICY IF EXISTS "jobs_insert_own" ON jobs;
CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

-- Salon owners can update their own jobs
DROP POLICY IF EXISTS "jobs_update_own" ON jobs;
CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- Salon owners can delete their own jobs
DROP POLICY IF EXISTS "jobs_delete_own" ON jobs;
CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE USING (auth.uid()::text = owner_id);

-- CRITICAL: Job seekers can see ONLY approved, visible jobs
DROP POLICY IF EXISTS "jobs_select_approved_public" ON jobs;
CREATE POLICY "jobs_select_approved_public" ON jobs
  FOR SELECT USING (
    status = 'LIVE' 
    AND is_visible = true 
    AND payment_status = 'approved'
    AND (auth.uid()::text != owner_id)  -- Don't see your own jobs
  );
```

**Verify**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'jobs';
-- Should show 5 policies
```

---

## STEP 6: CREATE POLICIES FOR JOB_APPLICATIONS TABLE

```sql
-- Job seekers can view their own applications
DROP POLICY IF EXISTS "applications_select_own" ON job_applications;
CREATE POLICY "applications_select_own" ON job_applications
  FOR SELECT USING (auth.uid()::text = applicant_id);

-- Job seekers can create applications
DROP POLICY IF EXISTS "applications_insert_own" ON job_applications;
CREATE POLICY "applications_insert_own" ON job_applications
  FOR INSERT WITH CHECK (auth.uid()::text = applicant_id);

-- Salon owners can view applications to their jobs
DROP POLICY IF EXISTS "applications_select_own_jobs" ON job_applications;
CREATE POLICY "applications_select_own_jobs" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.owner_id = auth.uid()::text
    )
  );
```

**Verify**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'job_applications';
-- Should show 3 policies
```

---

## STEP 7: CREATE POLICIES FOR SUBSCRIPTIONS TABLE

```sql
-- Users can view their own subscriptions
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert subscriptions
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update subscriptions
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);
```

---

## STEP 8: CREATE POLICIES FOR PAYMENTS TABLE

```sql
-- Users can view their own payments
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert payments
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

---

## STEP 9: CREATE POLICIES FOR JOB_SEEKERS TABLE

```sql
-- Job seekers can view their own profile
DROP POLICY IF EXISTS "job_seekers_select_own" ON job_seekers;
CREATE POLICY "job_seekers_select_own" ON job_seekers
  FOR SELECT USING (auth.uid()::text = user_id);

-- Job seekers can update their profile
DROP POLICY IF EXISTS "job_seekers_update_own" ON job_seekers;
CREATE POLICY "job_seekers_update_own" ON job_seekers
  FOR UPDATE USING (auth.uid()::text = user_id);

-- System can create job seeker profiles
DROP POLICY IF EXISTS "job_seekers_insert_own" ON job_seekers;
CREATE POLICY "job_seekers_insert_own" ON job_seekers
  FOR INSERT WITH CHECK (true);
```

---

## FINAL VERIFICATION

Run this to confirm all policies are in place:

```sql
-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Expected: 25+ policies across all tables
```

---

## TESTING RLS AFTER DEPLOYMENT

### Test 1: User Cannot See Other Users' Data

```sql
-- As User A, try to select User B's profile
-- This should FAIL (return no rows)
SELECT * FROM users WHERE id != auth.uid();

-- Expected: No rows returned (0 rows)
```

### Test 2: Job Seeker Cannot See Pending Jobs

```sql
-- As Job Seeker, try to select pending jobs
-- This should FAIL (return no rows)
SELECT * FROM jobs WHERE status = 'PAYMENT_PENDING';

-- Expected: No rows returned (0 rows)
```

### Test 3: Job Seeker CAN See Live, Visible Jobs

```sql
-- As Job Seeker, select live jobs
-- This should SUCCEED
SELECT * FROM jobs 
WHERE status = 'LIVE' 
AND is_visible = true 
AND payment_status = 'approved';

-- Expected: Returns approved, visible jobs
```

### Test 4: Salon Owner Can Only See Their Jobs

```sql
-- As Salon Owner, select jobs
SELECT * FROM jobs WHERE owner_id = auth.uid()::text;

-- Expected: Returns only their own jobs
```

---

## ROLLBACK (If Something Goes Wrong)

If RLS causes issues, you can disable it temporarily:

```sql
-- DISABLE RLS (TEMPORARY - for debugging only)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE salon_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_seekers DISABLE ROW LEVEL SECURITY;

-- After fixing, re-enable with:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## CHECKLIST

- [ ] Access Supabase SQL Editor
- [ ] Run: Enable RLS on all tables
- [ ] Verify: All tables show rowsecurity = true
- [ ] Run: Users table policies (3 policies)
- [ ] Run: Salon profiles policies (3 policies)
- [ ] Run: Jobs table policies (5 policies) - CRITICAL
- [ ] Run: Job applications policies (3 policies)
- [ ] Run: Subscriptions policies (3 policies)
- [ ] Run: Payments policies (2 policies)
- [ ] Run: Job seekers policies (3 policies)
- [ ] Run: Final verification query
- [ ] Test: RLS policies working correctly
- [ ] Confirm: 25+ policies in place

---

## AFTER DEPLOYMENT

1. **Test the app thoroughly:**
   - Job seeker should see only LIVE, visible jobs
   - Salon owner should see only their jobs
   - Admin should see pending jobs (API level, not RLS)
   - No errors in console

2. **Monitor for issues:**
   - Check Supabase logs for RLS violations
   - Check browser console for 403 Forbidden errors
   - Check server logs for database permission errors

3. **If issues occur:**
   - Check user IDs match between auth.uid() and database
   - Verify role (salon_owner vs job_seeker) is set correctly
   - Check that approved jobs have is_visible = true

---

## PRODUCTION CHECKLIST

Before going live:

- [ ] RLS deployed to production Supabase
- [ ] 25+ policies verified
- [ ] All workflows tested with RLS enabled
- [ ] No 403 Forbidden errors
- [ ] Job visibility working correctly
- [ ] Admin approval still working
- [ ] Backup of production database created
- [ ] Team notified of RLS deployment

**Status**: Ready for deployment → ✓ PROCEED TO STEP 4

