# Implementation Roadmap - Phases 4-10

**Current Status:** Phases 1-3 Complete (Production DB Integration)  
**Next Focus:** Phases 4-10 (Features, Security, Testing)

---

## Phase 4: Location Detection & Job Search
**Time Estimate:** 1-2 hours  
**Priority:** HIGH (Feature)  

### Tasks:
1. Find job search component
   - Search in `/components/` for search/discovery related files
   - Look for "search", "discover", "results", "jobs" in component names

2. Update search queries to use Supabase
   ```typescript
   // Before: Query localStorage
   const jobs = getFromStorage<Job>('salonjobsindia_jobs')
   
   // After: Query Supabase
   const { data } = await supabase
     .from('jobs')
     .select('*')
     .eq('status', 'LIVE')
     .ilike('location_city', `%${city}%`)
   ```

3. Add city-based filtering
   - Create filter UI component
   - Implement city dropdown/autocomplete
   - Filter Supabase queries by location_city

4. Cache location preferences
   - Store user's preferred search location
   - Load on next visit

### Files to Modify:
- Job search component (TBD)
- Supabase queries (already have template in supabase-sync.ts)

### Testing:
- [ ] Search for jobs by city
- [ ] Results returned from Supabase
- [ ] No results shows empty state
- [ ] Can save preferences

---

## Phase 5: Fix File Uploads for Payment Screenshots
**Time Estimate:** 1-2 hours  
**Priority:** HIGH (Data Efficiency)

### Current Problem:
```typescript
// Current: Screenshots stored as base64 (inefficient)
handleScreenshotUpload = (e) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)  // Converts to base64
  setPaymentScreenshot(reader.result) // Stores base64 string
}

// Then sends to API:
const { error } = await supabase
  .from('jobs')
  .insert({
    payment_screenshot_url: paymentScreenshot  // Base64 string
  })
```

### Solution:
1. Use Vercel Blob integration
   - Install: Already available in integrations
   - Get credentials from environment variables

2. Upload to Blob before creating job
   ```typescript
   import { put } from '@vercel/blob'
   
   const blob = await put(`payment-screenshots/${Date.now()}`, file)
   const screenshotUrl = blob.url
   
   // Then use screenshotUrl in Supabase
   ```

3. Store URL in Supabase (not base64)
   ```typescript
   const { error } = await supabase
     .from('jobs')
     .insert({
       payment_screenshot_url: screenshotUrl  // Just the URL
     })
   ```

4. Display screenshot in admin UI
   ```typescript
   <img 
     src={payment.screenshotUrl} 
     alt="Payment proof"
     className="max-w-md"
   />
   ```

5. Cleanup on rejection
   ```typescript
   // On job rejection:
   // Delete from Blob storage
   // Then delete job from Supabase
   ```

### Files to Modify:
- `components/customer/create-job.tsx` - handleScreenshotUpload
- `app/api/sync/route.ts` - Job creation
- `components/admin/admin-jobs.tsx` - Display screenshots

### Testing:
- [ ] Can upload PNG/JPG screenshot
- [ ] Screenshot appears in admin UI
- [ ] Screenshot URL stored in Supabase
- [ ] Rejected jobs clean up Blob files
- [ ] File size limits enforced (5MB)

---

## Phase 6: Implement Credits System with Supabase
**Time Estimate:** 1-2 hours  
**Priority:** MEDIUM (Feature Completion)

### Current Problem:
```typescript
// Currently only in localStorage
const userCredits = localStorage.getItem(`credits_${userId}`)
```

### Solution:

1. Add credits field to users table (migration)
   ```sql
   ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
   ```

2. Create credits service
   ```typescript
   // lib/credits-service.ts
   export const CreditsService = {
     getBalance: async (userId: string) => {
       const { data } = await supabase
         .from('users')
         .select('credits')
         .eq('id', userId)
         .single()
       return data?.credits || 0
     },
     
     deduct: async (userId: string, amount: number) => {
       const { error } = await supabase.rpc('deduct_credits', {
         user_id: userId,
         amount: amount
       })
       return !error
     },
     
     refund: async (userId: string, amount: number) => {
       const { error } = await supabase.rpc('add_credits', {
         user_id: userId,
         amount: amount
       })
       return !error
     }
   }
   ```

3. Integrate into job posting flow
   - Deduct credits when job is posted
   - Refund when job is rejected
   - Show balance to user

4. Sync credits service
   ```typescript
   // In supabase-sync.ts add:
   export async function syncCreditsToSupabase(userId: string, credits: number) {
     const { error } = await supabase
       .from('users')
       .update({ credits })
       .eq('id', userId)
     return !error
   }
   ```

### Files to Create/Modify:
- `lib/credits-service.ts` - NEW
- `app/api/jobs/create/route.ts` - Deduct on creation
- `app/api/jobs/approve/route.ts` - Show approval
- `components/customer/create-job.tsx` - Show balance

### Testing:
- [ ] Credits shown in dashboard
- [ ] Credits deducted on job posting
- [ ] Credits refunded on rejection
- [ ] Can't post without credits
- [ ] Persists across devices

---

## Phase 7: Real-time Sync & WebSocket Listeners
**Time Estimate:** 2-3 hours  
**Priority:** MEDIUM (UX Improvement)

### Current Problem:
Polling every 5-30 seconds causes:
- Unnecessary API calls
- Delayed updates
- Higher latency
- Battery drain on mobile

### Solution:

1. Setup Supabase real-time listeners
   ```typescript
   // lib/realtime-service.ts
   import { createClient } from '@supabase/supabase-js'
   
   export function subscribeToJobUpdates(jobId: string, callback: Function) {
     const supabase = getSupabaseClient()
     
     return supabase
       .from(`jobs:id=eq.${jobId}`)
       .on('UPDATE', payload => {
         callback(payload.new)
       })
       .subscribe()
   }
   ```

2. Replace polling with subscriptions
   ```typescript
   // Before (AdminJobs component):
   const interval = setInterval(loadPendingPayments, 5000)
   
   // After:
   useEffect(() => {
     const subscription = subscribeToJobUpdates('*', (job) => {
       if (job.status === 'PAYMENT_PENDING') {
         addToPendingList(job)
       }
     })
     return () => subscription.unsubscribe()
   }, [])
   ```

3. Update all components using polling
   - Admin dashboard
   - Job seeker dashboard
   - Approval status checker

4. Add reconnection logic
   - Handle dropped connections
   - Auto-reconnect with backoff

### Files to Create/Modify:
- `lib/realtime-service.ts` - NEW
- `components/admin/admin-dashboard.tsx`
- `components/admin/admin-jobs.tsx`
- Any polling components

### Testing:
- [ ] Updates appear instantly (no 5s delay)
- [ ] Works across multiple tabs
- [ ] Reconnects on network drop
- [ ] No duplicate events
- [ ] Properly unsubscribes on unmount

---

## Phase 8: Comprehensive Error Handling & Logging
**Time Estimate:** 2-3 hours  
**Priority:** MEDIUM (Reliability)

### Current Problem:
- Basic console.error only
- No structured logging
- No error tracking
- Poor user feedback

### Solution:

1. Create error service
   ```typescript
   // lib/error-service.ts
   interface ErrorLog {
     timestamp: string
     level: 'error' | 'warn' | 'info'
     message: string
     context: Record<string, any>
     userId?: string
     stackTrace?: string
   }
   
   export const ErrorService = {
     log: async (error: ErrorLog) => {
       const { error: dbError } = await supabase
         .from('error_logs')
         .insert([error])
       
       // Also log to console in dev
       if (process.env.NODE_ENV === 'development') {
         console.error('[V0]', error)
       }
     },
     
     logApiError: (endpoint: string, error: unknown) => {
       ErrorService.log({
         timestamp: new Date().toISOString(),
         level: 'error',
         message: `API Error: ${endpoint}`,
         context: { error: String(error) }
       })
     }
   }
   ```

2. Add error boundaries
   ```typescript
   // components/error-boundary.tsx
   export class ErrorBoundary extends React.Component {
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       ErrorService.log({
         timestamp: new Date().toISOString(),
         level: 'error',
         message: error.message,
         context: { componentStack: errorInfo.componentStack }
       })
     }
   }
   ```

3. Add retry logic
   ```typescript
   // lib/retry-utils.ts
   export async function retryWithBackoff<T>(
     fn: () => Promise<T>,
     maxAttempts = 3,
     initialDelay = 1000
   ): Promise<T> {
     for (let i = 0; i < maxAttempts; i++) {
       try {
         return await fn()
       } catch (error) {
         if (i === maxAttempts - 1) throw error
         await new Promise(resolve => 
           setTimeout(resolve, initialDelay * Math.pow(2, i))
         )
       }
     }
     throw new Error('Max retries exceeded')
   }
   ```

4. Create error logs table
   ```sql
   CREATE TABLE error_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     timestamp TIMESTAMP DEFAULT NOW(),
     level TEXT,
     message TEXT,
     context JSONB,
     user_id UUID REFERENCES users(id),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Files to Create/Modify:
- `lib/error-service.ts` - NEW
- `components/error-boundary.tsx` - NEW
- `lib/retry-utils.ts` - NEW
- All API endpoints - Add error handling
- All components - Wrap in error boundary

### Testing:
- [ ] Errors logged to Supabase
- [ ] User sees friendly error message
- [ ] API errors retry automatically
- [ ] Network errors handled gracefully

---

## Phase 9: Row-Level Security (RLS) Policies
**Time Estimate:** 1-2 hours  
**Priority:** CRITICAL (Security)

### Current Problem:
⚠️ NO ROW-LEVEL SECURITY - ANYONE CAN ACCESS ANY DATA

### Solution:

1. Create RLS policies for users table
   ```sql
   -- Users can only view their own profile
   CREATE POLICY users_select ON users
     FOR SELECT USING (auth.uid() = id);
   
   -- Users can update their own profile
   CREATE POLICY users_update ON users
     FOR UPDATE USING (auth.uid() = id);
   ```

2. Create RLS policies for jobs table
   ```sql
   -- Anyone can view live jobs
   CREATE POLICY jobs_select_public ON jobs
     FOR SELECT USING (status = 'LIVE' AND is_visible = true);
   
   -- Salon owners can only see their own pending jobs
   CREATE POLICY jobs_select_own ON jobs
     FOR SELECT USING (auth.uid() = owner_id);
   
   -- Salon owners can only update own jobs
   CREATE POLICY jobs_update ON jobs
     FOR UPDATE USING (auth.uid() = owner_id);
   ```

3. Create admin role
   ```sql
   -- Create admin role
   CREATE ROLE admin;
   
   -- Admins can see all pending jobs
   CREATE POLICY jobs_select_admin ON jobs
     FOR SELECT USING (
       auth.jwt() ->> 'role' = 'admin'
     );
   ```

4. Apply to all tables
   - job_seekers
   - salon_owners
   - subscriptions
   - payments
   - notifications

5. Test RLS enforcement
   ```sql
   -- Verify policies work
   SET ROLE authenticated;
   SET app.current_user_id = 'user-1';
   SELECT * FROM users WHERE id != 'user-1'; -- Should return 0 rows
   ```

### Files to Create:
- `migrations/rls-policies.sql` - NEW

### Testing:
- [ ] Users can only see own data
- [ ] Admins can see all data
- [ ] Public can see live jobs only
- [ ] No cross-user data leakage
- [ ] RLS policies in place (not bypassed)

### CRITICAL: Test before deployment!

---

## Phase 10: Complete End-to-End Testing & Verification
**Time Estimate:** 3-4 hours  
**Priority:** HIGH (Quality)

### Test Environment Setup:
```bash
# 1. Staging environment
# 2. Test database
# 3. Test user accounts
# 4. Automated test suite
```

### Critical Path Tests:
```typescript
describe('Production Critical Path', () => {
  test('Signup → Job Creation → Approval → Discovery', async () => {
    // 1. User signs up
    const user = await signUp({
      name: 'Test Salon',
      email: 'test@salon.com',
      phone: '9876543210',
      password: 'Test123!'
    })
    expect(user).toBeTruthy()
    
    // 2. Verify data in Supabase
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@salon.com')
    expect(data?.length).toBe(1)
    
    // 3. Create job
    const job = await createJob({
      title: 'Hair Stylist',
      salary: '15000-20000',
      location: { lat: 0, lng: 0, address: 'Test' }
    })
    expect(job.status).toBe('PAYMENT_PENDING')
    
    // 4. Admin approves
    const approved = await approveJob(job.id, 'admin')
    expect(approved.status).toBe('LIVE')
    
    // 5. Job seeker finds job
    const jobs = await searchJobs('Hair Stylist')
    expect(jobs.find(j => j.id === job.id)).toBeTruthy()
  })
})
```

### Performance Tests:
- Admin dashboard loads < 1s
- Job search returns < 1s
- Form submission completes < 2s
- No memory leaks during polling

### Security Tests:
- Users can't access other users' data
- Admins need proper auth
- Payment sensitive data protected
- No SQL injection vulnerabilities

### Cross-Device Tests:
- Data syncs between browsers
- Real-time updates work
- Offline mode works
- Cache invalidates properly

### Usability Tests:
- All forms have proper validation
- Error messages are helpful
- Navigation works
- Mobile responsive

### Files to Create:
- `__tests__/critical-path.test.ts` - NEW
- `__tests__/security.test.ts` - NEW
- `__tests__/performance.test.ts` - NEW

### Checklist:
- [ ] All critical paths pass
- [ ] No security vulnerabilities found
- [ ] Performance meets targets
- [ ] No data corruption
- [ ] Proper error handling
- [ ] Mobile works
- [ ] Cross-browser works
- [ ] Stress testing passed

---

## Summary Timeline

| Phase | Name | Effort | Priority | Status |
|-------|------|--------|----------|--------|
| 1 | Auth Persistence | 1h | HIGH | ✅ COMPLETE |
| 2 | Job Submission | 1h | HIGH | ✅ COMPLETE |
| 3 | Admin Approval | 1h | HIGH | ✅ COMPLETE |
| 4 | Location & Search | 1-2h | HIGH | ⏳ TODO |
| 5 | File Uploads | 1-2h | HIGH | ⏳ TODO |
| 6 | Credits System | 1-2h | MEDIUM | ⏳ TODO |
| 7 | Real-time Sync | 2-3h | MEDIUM | ⏳ TODO |
| 8 | Error Handling | 2-3h | MEDIUM | ⏳ TODO |
| 9 | RLS Policies | 1-2h | CRITICAL | ⏳ TODO |
| 10 | E2E Testing | 3-4h | HIGH | ⏳ TODO |

**Total Remaining Effort:** 6-8 hours for all 10 phases

---

## Deployment Checklist

Before deploying to production:

- [ ] Phase 1-3 Complete ✅
- [ ] Phase 5 Complete (File Uploads)
- [ ] Phase 9 Complete (RLS Policies) - CRITICAL
- [ ] Phase 10 Complete (Testing)
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Backup strategy in place
- [ ] Monitoring/alerts configured
- [ ] Support/runbooks ready
- [ ] Stakeholders signed off

---

## Notes for Next Developer

1. Build passes currently - run `npm run build` to verify
2. Dev server available at http://localhost:3000
3. All APIs already created and functional
4. Supabase is connected and configured
5. Use existing patterns in codebase
6. Check error logs often during implementation
7. Test each phase before moving to next
8. RLS policies (Phase 9) are critical - test thoroughly

---

**Created:** June 19, 2026  
**Last Updated:** June 19, 2026  
**Status:** Ready for Phase 4 implementation

