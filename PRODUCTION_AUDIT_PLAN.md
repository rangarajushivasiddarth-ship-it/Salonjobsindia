# Production Emergency Stabilization - Comprehensive Fix Plan
## Salon Jobs India - June 19, 2026

### CRITICAL FINDINGS

**Application Status:** BROKEN FOR PRODUCTION
- Auth: Only localStorage, not Supabase
- Database: Has Supabase tables but app not using them
- Salon Owner Workflow: Job submission backend incomplete
- Admin System: No real-time sync, no approval workflow
- File Uploads: Payment screenshots not uploading
- Credits: Tracked in localStorage only

**Root Cause:** Application built with localStorage layer instead of Supabase integration

---

## PHASE 1: Fix Database Persistence & Auth (CRITICAL)

### Issue 1.1: User Auth Not Persisted to Supabase
**Current State:**
- Users registered/logged in via `UserService.login()` → saved to localStorage
- No Supabase `users` table insert/update
- Auth session lost on browser refresh

**Fix:**
1. Modify `lib/data-service.ts` UserService to call Supabase API
2. Create `lib/supabase-client.ts` for Supabase operations
3. Update `signUp()` and `signIn()` in app-context to persist to Supabase
4. Implement session validation against Supabase

### Issue 1.2: No Supabase Client Setup
**Current State:**
- No Supabase client initialized
- No API routes for database operations

**Fix:**
1. Create Supabase client instance in `lib/supabase-client.ts`
2. Add auth middleware in API routes
3. Test with actual database writes

---

## PHASE 2: Complete Salon Owner Job Submission Workflow

### Issue 2.1: Job Creation Not Saved to Supabase
**Current State:**
- Jobs created in localStorage only
- No job_id returned
- Admin doesn't see pending jobs

**Fix:**
1. Update `POST /api/sync` to insert job into Supabase `jobs` table
2. Set status = 'PAYMENT_PENDING'
3. Return job_id to frontend
4. Track payment_screenshot_url

### Issue 2.2: Payment Screenshot Upload Not Working
**Current State:**
- No file upload implementation
- payment_screenshot_url null in database

**Fix:**
1. Integrate Vercel Blob for file storage
2. Create upload handler in API route
3. Store URL in jobs table
4. Validate file before upload

### Issue 2.3: Job Doesn't Move to Payment Pending Queue
**Current State:**
- Job stays in draft
- Admin approval workflow broken

**Fix:**
1. Update job status: draft → PAYMENT_PENDING
2. Trigger notification to admin
3. Add to pending approval queue

---

## PHASE 3: Fix Admin Approval & Sync System

### Issue 3.1: Admin Can't See Pending Jobs
**Current State:**
- No `/api/admin/pending-jobs` working correctly
- Jobs not fetched from Supabase
- No real-time updates

**Fix:**
1. Create proper `GET /api/admin/pending-jobs` endpoint
2. Query Supabase for jobs with status = 'PAYMENT_PENDING'
3. Return salonName, ownerName, jobTitle, payment info
4. Add real-time listener

### Issue 3.2: Admin Approval Doesn't Work End-to-End
**Current State:**
- Already fixed but needs full testing
- `/api/jobs/approve` using Supabase
- Missing: transaction safety, notifications

**Fix:**
1. Test approval workflow completely
2. Add transaction to update job + send notification
3. Verify salary/location/skills data persisted
4. Check job visible to job seekers

### Issue 3.3: Salon Owner Can't See Job Status
**Current State:**
- No dashboard for salon owner to track job status
- Can't see if approved or pending

**Fix:**
1. Create owner dashboard page
2. Show: draft jobs, pending approval, live jobs, expired jobs
3. Real-time updates on job status

---

## PHASE 4: Implement Location Detection & Job Search

### Issue 4.1: No Geolocation Implementation
**Current State:**
- Location object in schema but not populated
- Job seekers can't search by location
- Salon owners can't specify job location

**Fix:**
1. Implement `detectLocationFromBrowser()` function
2. Get lat/lng from browser geolocation API
3. Reverse geocode to address
4. Save to database

### Issue 4.2: Job Seeker Search Doesn't Filter by Location
**Current State:**
- Job search returns all jobs
- No distance filtering
- No map view

**Fix:**
1. Implement location-based search in `GET /api/jobs`
2. Filter by distance (e.g., 5km radius)
3. Show nearest salons first
4. Optional: Add map visualization

---

## PHASE 5: Fix File Uploads for Payment Screenshots

### Issue 5.1: Vercel Blob Not Integrated
**Current State:**
- No file upload handler
- No blob storage integration

**Fix:**
1. Add Vercel Blob integration
2. Create `POST /api/upload` handler
3. Validate file type (image only)
4. Return URL
5. Store URL in jobs.payment_screenshot_url

### Issue 5.2: Admin Can't View Payment Screenshot
**Current State:**
- URL not shown in admin interface
- Can't verify payment

**Fix:**
1. Display image in admin approval page
2. Allow download/zoom
3. Add verification checkbox

---

## PHASE 6: Implement Credits System with Supabase

### Issue 6.1: Credits Tracked in localStorage Only
**Current State:**
- No credits table in Supabase
- Credits lost on logout
- Can't track usage

**Fix:**
1. Create `credits` table in Supabase
2. Columns: user_id, credits_available, credits_used, transactions
3. Migrate localStorage credits to table
4. Update on every purchase/usage

### Issue 6.2: Credit Deduction Not Atomic
**Current State:**
- No transaction handling
- Can spend credits multiple times

**Fix:**
1. Use Supabase transaction for credit deduction
2. Rollback if job posting fails
3. Log all credit transactions
4. Prevent negative balance

---

## PHASE 7: Fix Real-time Sync & WebSocket Listeners

### Issue 7.1: No Real-time Updates
**Current State:**
- Admin doesn't see new pending jobs in real-time
- Salon owner doesn't see job approval notification
- Job seekers don't see new jobs

**Fix:**
1. Implement Supabase RealtimeClient
2. Subscribe to jobs table changes
3. Subscribe to notifications channel
4. Push updates to UI without page refresh

### Issue 7.2: Sync Service Not Complete
**Current State:**
- `SyncService.subscribe()` exists but incomplete
- No actual Supabase realtime

**Fix:**
1. Implement full realtime subscription
2. Handle connection/reconnection
3. Batch updates
4. Error handling & retry logic

---

## PHASE 8: Add Comprehensive Error Handling & Logging

### Issue 8.1: Silent Failures
**Current State:**
- API errors not logged
- Users don't see error messages
- Admin debugging hard

**Fix:**
1. Add error handling to all API routes
2. Return meaningful error messages
3. Log to database for debugging
4. Show toast notifications

### Issue 8.2: No Request/Response Logging
**Current State:**
- Can't debug issues
- No audit trail

**Fix:**
1. Log all API requests/responses
2. Include request_id, timestamp, user_id
3. Store in sync_logs table
4. Add admin log viewer

---

## PHASE 9: Implement Row-Level Security (RLS)

### Issue 9.1: RLS Policies Incomplete
**Current State:**
- RLS enabled but policies may be missing
- Users can see other users' data

**Fix:**
1. Audit all RLS policies
2. Ensure:
   - Users can only see their own profile
   - Salon owners can only see their own jobs
   - Job seekers can see all live jobs
   - Admin can see all jobs
3. Test policy violations

### Issue 9.2: Service Role Key Exposed
**Current State:**
- Potential security issue
- Can access all data

**Fix:**
1. Use Row Level Security for all queries
2. Pass user_id from auth context
3. Never use service role key in frontend

---

## PHASE 10: Complete End-to-End Testing & Verification

### Test Suite:
1. **Auth Flow:**
   - Sign up → saved to Supabase
   - Sign in → session validated
   - Logout → session cleared
   - Browser refresh → session persisted

2. **Salon Owner Workflow:**
   - Create job → saved with PAYMENT_PENDING
   - Upload screenshot → stored in Blob
   - Appears in admin queue → real-time

3. **Admin Approval:**
   - See pending jobs → real-time list
   - Approve job → status → LIVE
   - Job appears to seekers → searchable
   - Notifications sent → received

4. **Job Seeker Discovery:**
   - Search jobs → all LIVE jobs
   - Filter by location → nearest first
   - Apply to job → tracked
   - See job details → complete info

5. **Credits System:**
   - Purchase credits → deducted
   - Use credits → tracked
   - Can't go negative → error
   - History shown → audit trail

6. **Real-time Updates:**
   - New job published → appears immediately
   - Job approved → shows in real-time
   - Notification sent → received immediately

---

## Implementation Strategy

### Day 1 (Phases 1-3):
- Fix auth persistence to Supabase
- Complete job submission workflow
- Fix admin approval system

### Day 2 (Phases 4-6):
- Implement location detection
- Fix file uploads
- Implement credits system

### Day 3 (Phases 7-9):
- Add real-time sync
- Add error handling
- Implement RLS policies

### Day 4:
- Complete testing (Phase 10)
- Bug fixes
- Deployment verification

---

## Success Criteria

All phases must achieve:
1. No console errors
2. No data loss
3. All workflows end-to-end verified
4. Data persisted to Supabase (not localStorage)
5. Real-time updates working
6. Admin can approve jobs
7. Job seekers can discover jobs
8. Payment tracking complete
9. Credits system working
10. Production ready for deployment

---

## Critical Blockers to Fix First

1. **Auth to Supabase** - Without this, everything fails
2. **Job submission to Supabase** - Core workflow
3. **Admin approval** - Already partially fixed, needs verification
4. **File uploads** - Payment proof required
5. **Real-time sync** - User experience

---

## NOT Included in Fixes

- UI/UX changes (only bug fixes)
- New features
- Design changes
- Branding updates
- Performance optimization (unless critical)

