# Phase 9: Row-Level Security (RLS) Implementation Guide

## Overview

Row-Level Security (RLS) is CRITICAL for production. It ensures users can only access their own data at the database level, preventing unauthorized data access even if application code has bugs.

## Quick Start

### 1. Enable RLS in Supabase Dashboard

Visit your Supabase project → SQL Editor and run:

```sql
-- Copy entire contents of lib/db/rls-policies.sql
-- Paste in SQL Editor and execute
```

### 2. Verify Policies Are Applied

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

Expected output should show:
- `users` - true
- `job_seekers` - true
- `salon_profiles` - true
- `jobs` - true
- `subscriptions` - true
- `payments` - true

### 3. Test Policies

```sql
-- Test as user_id: "user-123"
-- This should fail (no access to other user's data)
SELECT * FROM users WHERE id = 'other-user-456';

-- This should succeed
SELECT * FROM users WHERE id = 'user-123';
```

## Security Policies Implemented

### Users Table
- ✅ Users can view own profile
- ✅ Users can update own profile
- ✅ System can create users
- ❌ Users cannot access other users' data

### Job Seekers
- ✅ Job seekers view own profile
- ✅ Job seekers update own profile
- ❌ Job seekers cannot see other seekers' profiles

### Salon Profiles
- ✅ Owners view own profile
- ✅ Owners update own credits
- ❌ Owners cannot see other salons' profiles

### Jobs
- ✅ Owners see their own jobs
- ✅ Owners create/update/delete own jobs
- ✅ Job seekers see ONLY approved, visible jobs
- ❌ Job seekers cannot see private/pending jobs
- ❌ Owners cannot see other owners' jobs

### Subscriptions & Payments
- ✅ Users see own subscriptions/payments
- ✅ Users can add own payments
- ❌ Users cannot access other users' financial data

## Critical Implementation Notes

### Authentication Setup

RLS policies use `auth.uid()` which returns the authenticated user's UUID. Ensure:

1. **User signup syncs UUID to localStorage:**
```typescript
// In app-context.tsx, save auth.uid() locally
localStorage.setItem('userId', user.id) // Must be UUID
```

2. **API calls must send userId:**
```typescript
fetch('/api/jobs', {
  headers: { 'X-User-Id': userId }
})
```

3. **Backend validates userId:**
```typescript
// In API route
const userId = request.headers.get('X-User-Id')
// Pass to Supabase queries
```

### Testing RLS Policies

Use this in Supabase SQL Editor to test:

```sql
-- Set user context
set request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Now test queries - they'll be filtered by RLS
select * from jobs; -- Will only show this user's jobs

-- Reset
reset request.jwt.claims;
```

## Potential Issues

### Issue: "new row violates row-level security policy"
**Cause:** User ID mismatch  
**Fix:** Verify `auth.uid()` matches the user_id in your data

### Issue: Admin can't see all jobs
**Cause:** RLS policies too restrictive  
**Solution:** Add admin bypass policy (see Optional Admin Access below)

### Issue: Jobs visible to everyone
**Cause:** Policy uses `is_visible = true` without `status = 'APPROVED'`  
**Fix:** Ensure both conditions are checked

## Optional: Admin Access

If you need an admin panel that can see all data:

```sql
-- Create admin role
CREATE ROLE admin_user;

-- Give admins full access to all tables
CREATE POLICY "admin_bypass_jobs" ON jobs
  FOR ALL USING (current_role = 'admin_user');

CREATE POLICY "admin_bypass_users" ON users
  FOR ALL USING (current_role = 'admin_user');

-- Grant role to admin users
GRANT admin_user TO 'admin-user-uuid-here';
```

## Monitoring & Debugging

### Check Policy Coverage
```sql
-- See all active RLS policies
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies 
ORDER BY schemaname, tablename;
```

### Test Policy Performance
```sql
-- Analyze query performance with policies
EXPLAIN ANALYZE SELECT * FROM jobs WHERE owner_id = 'user-uuid';
```

### Audit RLS Violations
Enable PostgreSQL logging:
1. Supabase Dashboard → Database → Logs
2. Filter for "RLS"
3. Review denied queries

## Rollback Plan

If policies cause issues:

```sql
-- Temporarily disable (EMERGENCY ONLY)
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Fix the issue
DROP POLICY "policy_name" ON table_name;
CREATE POLICY "fixed_policy" ON table_name ...

-- Re-enable
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
```

## Production Checklist

- [ ] All RLS policies deployed to production Supabase
- [ ] Verified policies are enabled on all tables
- [ ] Tested user isolation (user A can't see user B's data)
- [ ] Tested job visibility (approved jobs visible, pending jobs hidden)
- [ ] Tested admin access (if applicable)
- [ ] Monitored logs for RLS violations
- [ ] Documented admin bypass procedures
- [ ] Team trained on RLS limitations

## Next Steps

1. ✅ Copy policies from `lib/db/rls-policies.sql`
2. ✅ Run in Supabase SQL Editor
3. ✅ Verify policies are applied
4. ✅ Test user isolation
5. ✅ Monitor logs for issues
6. ✅ Deploy to production

**Timeline:** 30 minutes to deploy, 2 hours to test thoroughly

**Security Impact:** CRITICAL - Prevents unauthorized data access
