# Phases 7-10: Real-time Sync, Error Handling, Security & Testing

## Phase 7: Fix Real-time Sync & WebSocket Listeners (2-3 hours)

### Current Status
- Realtime API endpoint exists at `/api/realtime/jobs`
- WebSocket infrastructure ready but may not be connected to job fetching

### Implementation Tasks

#### 7.1 Connect Realtime to Job Discovery Component
File: `components/customer/job-discovery.tsx`

```typescript
// Add realtime subscription in useEffect
useEffect(() => {
  const channel = supabase
    .channel('live-jobs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `status=eq.approved`
      },
      (payload) => {
        console.log('[v0] Job update:', payload)
        setJobs(prev => {
          // Update list with new/modified jobs
          if (payload.eventType === 'INSERT') {
            return [payload.new, ...prev]
          } else if (payload.eventType === 'UPDATE') {
            return prev.map(j => j.id === payload.new.id ? payload.new : j)
          } else if (payload.eventType === 'DELETE') {
            return prev.filter(j => j.id !== payload.old.id)
          }
          return prev
        })
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}, [])
```

#### 7.2 Connect Admin Realtime for Pending Jobs
File: `components/admin/admin-jobs.tsx`

```typescript
// Already set to refresh every 5 seconds, can upgrade to realtime
// Add subscription to pending jobs channel
useEffect(() => {
  const channel = supabase
    .channel('pending-jobs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `status=eq.pending`
      },
      (payload) => {
        // Refresh pending payments
        loadPendingPayments()
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}, [])
```

#### 7.3 Test Realtime
- Start dev server
- Open job discovery page
- From another browser, create a job through admin
- Job should appear in real-time without page refresh

---

## Phase 8: Add Comprehensive Error Handling & Logging (2-3 hours)

### Current Status
- Basic error logging in place
- Need centralized error handler
- Missing user-facing error messages in some workflows

### Implementation Tasks

#### 8.1 Create Global Error Handler
File: `lib/error-handler.ts` (NEW)

```typescript
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AppError {
  code: string
  message: string
  severity: ErrorSeverity
  context?: Record<string, any>
  userMessage?: string
}

export function createAppError(
  code: string,
  message: string,
  severity: ErrorSeverity = 'error',
  userMessage?: string
): AppError {
  return {
    code,
    message,
    severity,
    userMessage: userMessage || message,
  }
}

export async function logError(error: AppError) {
  // Log to console for development
  console.error(`[${error.code}]`, error.message, error.context)

  // TODO: Send to error tracking service (Sentry)
  // TODO: Save to database for monitoring dashboard
}

// Common error types
export const ErrorCodes = {
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  JOB_CREATION_FAILED: 'JOB_CREATION_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  LOCATION_ACCESS_DENIED: 'LOCATION_ACCESS_DENIED',
  CREDITS_INSUFFICIENT: 'CREDITS_INSUFFICIENT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
}
```

#### 8.2 Update File Upload with Error Handling
File: `components/customer/credit-payment.tsx` - Already has error display

#### 8.3 Update Job Creation with Error Handling
File: `components/customer/create-job.tsx`

```typescript
const handleSubmit = async () => {
  try {
    setIsSubmitting(true)
    setError(null)

    // Validate
    if (!jobForm.title?.trim()) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        'Job title is required',
        'warning',
        'Please enter a job title'
      )
    }

    // Create job
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'job', data: jobForm })
    })

    if (!response.ok) {
      const data = await response.json()
      throw createAppError(
        ErrorCodes.JOB_CREATION_FAILED,
        data.error || 'Failed to create job',
        'error',
        'Could not create job. Please try again.'
      )
    }

    setSuccess(true)
  } catch (err) {
    const appError = err instanceof AppError ? err : createAppError(
      ErrorCodes.NETWORK_ERROR,
      String(err),
      'error'
    )
    await logError(appError)
    setError(appError.userMessage)
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## Phase 9: Implement Row-Level Security (RLS) Policies (1-2 hours) ⚠️ CRITICAL

### Current Status
- Supabase integration exists
- RLS policies may not be properly configured
- **Security Risk:** Users could potentially access other users' data

### Implementation Tasks

#### 9.1 Enable RLS on All Tables
In Supabase Dashboard → Authentication → Policies

Enable Row Level Security on:
- `users` table
- `job_seekers` table
- `salon_profiles` table
- `jobs` table
- `subscriptions` table
- `payments` table

#### 9.2 Create RLS Policies

**Policy: Users can only read their own profile**
```sql
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);
```

**Policy: Salon owners can only read their own profile & jobs**
```sql
CREATE POLICY "Salon owners can read own profile"
  ON salon_profiles FOR SELECT
  USING (auth.uid()::text = owner_id);

CREATE POLICY "Salon owners can update own profile"
  ON salon_profiles FOR UPDATE
  USING (auth.uid()::text = owner_id);
```

**Policy: Job seekers can read approved jobs**
```sql
CREATE POLICY "Job seekers can read approved jobs"
  ON jobs FOR SELECT
  USING (status = 'approved' OR auth.uid()::text = owner_id);
```

**Policy: Only admins can read pending jobs**
```sql
CREATE POLICY "Admins can read pending jobs"
  ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role = 'admin'
    )
  );
```

#### 9.3 Verify RLS Protection
Test by:
1. Login as Job Seeker A
2. Try to access Job Seeker B's profile via direct API call
3. Should fail with 403 Forbidden

---

## Phase 10: Complete End-to-End Testing & Verification (3-4 hours)

### 10.1 Manual Testing Checklist

#### Authentication Flow
- [ ] Sign up as job seeker
- [ ] Sign up as salon owner
- [ ] Login works with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Session persists after page refresh
- [ ] Logout works

#### Salon Owner Workflow
- [ ] Create job posting
- [ ] Upload payment screenshot
- [ ] Admin approves payment
- [ ] Job goes live
- [ ] Job appears in job seeker search
- [ ] Can view applications

#### Job Seeker Workflow
- [ ] Search jobs by location
- [ ] View job details
- [ ] Apply for job
- [ ] Receive confirmation

#### Credits System
- [ ] Unlock candidate uses credit
- [ ] Credit deduction shows immediately
- [ ] Alert shows when <5 credits
- [ ] Buy credits flow works
- [ ] Credits appear after approval

#### File Uploads
- [ ] Upload image to Blob
- [ ] Image displays in preview
- [ ] Upload fails for large files
- [ ] Upload fails for non-image files
- [ ] Error messages are clear

#### Realtime Updates
- [ ] New jobs appear without refresh
- [ ] Job updates visible to all viewers
- [ ] Pending jobs update in admin panel
- [ ] Multiple browser windows sync

#### Admin Panel
- [ ] View pending job payments
- [ ] Approve payment
- [ ] Reject payment with reason
- [ ] View job statistics
- [ ] Download reports

### 10.2 Browser Testing

```bash
# Test on:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)
```

### 10.3 Performance Testing

```bash
# Use Lighthouse
# Measure:
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

# Use Web Vitals
npm run test:vitals
```

### 10.4 Security Testing

```bash
# OWASP Top 10 checks:
- [ ] No XSS vulnerabilities (validate all inputs)
- [ ] No SQL injection (use parameterized queries)
- [ ] No CSRF (verify CSRF tokens)
- [ ] Passwords hashed (use bcrypt/Supabase auth)
- [ ] RLS properly configured
- [ ] No sensitive data in logs
- [ ] File uploads validated
```

### 10.5 Database Backup & Recovery

```sql
-- Backup script
pg_dump --host=$SUPABASE_HOST --username=$SUPABASE_USER \
  --password=$SUPABASE_PASSWORD --database=$DATABASE > backup.sql

-- Recovery script  
psql --host=$SUPABASE_HOST --username=$SUPABASE_USER \
  --password=$SUPABASE_PASSWORD --database=$DATABASE < backup.sql
```

---

## Deployment Checklist

- [ ] All phases 1-10 complete
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] Performance scores > 90
- [ ] Manual testing complete
- [ ] RLS policies verified
- [ ] Error logging working
- [ ] Backup created
- [ ] Monitoring dashboard set up
- [ ] Runbooks created for common issues
- [ ] Team trained on system

---

## Next Steps After Deployment

1. **Monitor** - Watch error logs and user feedback
2. **Iterate** - Fix bugs and improve UX based on real usage
3. **Scale** - Optimize database queries for growth
4. **Expand** - Add features based on user requests
5. **Maintain** - Regular security updates and backups
