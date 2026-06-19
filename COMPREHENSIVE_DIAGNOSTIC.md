# COMPREHENSIVE DIAGNOSTIC - Payment Workflow Testing

## STEP-BY-STEP VERIFICATION

### STEP 1: Verify Salon Owner Can Submit Payment
```
Navigate to: /
Select Role: Salon Owner
Fill Job Form: (all fields)
Upload Logo: Yes
Detect Location: Yes
Continue to Payment: Yes
Upload Screenshot: Yes
Click Submit Payment: 

EXPECTED:
✅ Console shows: "[Realtime Sync] Submitting job payment: {id, ...}"
✅ POST /api/sync called with type='job-payment'
✅ Response: {success: true, jobId, data}
✅ Job created in Supabase with:
   - status = 'PAYMENT_PENDING'
   - payment_status = 'pending'
   - is_visible = false

VERIFY: Check Supabase jobs table for new record with correct status values
```

### STEP 2: Verify Admin Can Login and Token is Generated
```
Navigate to: /admin
Email: admin@salonjobsindia.com
Password: admin123
Click Sign In:

EXPECTED:
✅ Login succeeds
✅ Redirected to Dashboard
✅ localStorage has 'salonjobsindia_admin_session' key
✅ Session contains: {isAuthenticated: true, token: 'admin_token_...',  email, expiresAt}

VERIFY: Open DevTools → Application → Local Storage → Check key exists
```

### STEP 3: Verify Admin Can See Pending Payments
```
On: Admin Dashboard
Click: Pending Payments tab

EXPECTED:
✅ Network tab shows: GET /api/admin/pending-jobs
✅ Request Headers include: Authorization: Bearer admin_token_...
✅ Response Status: 200 (not 401)
✅ Response includes: {success: true, data: [{job...}], count}
✅ Job from Step 1 appears in list

VERIFY: Open DevTools → Network → Filter admin-pending-jobs
Check: Status 200, Authorization header present
```

### STEP 4: Verify Admin Can Approve Payment
```
On: Pending Payments list
Click: Approve button on job

EXPECTED:
✅ POST /api/jobs/approve called
✅ Request includes: {jobId, action: 'approve'}
✅ Request Headers include: Authorization: Bearer admin_token_...
✅ Response Status: 200 (not 401)
✅ Job status in Supabase changes:
   - status = 'LIVE'
   - payment_status = 'approved'
   - is_visible = true

VERIFY: Supabase jobs table - check job record updated
```

### STEP 5: Verify Customer Can See Live Job
```
Navigate to: / (as job seeker)
Go to: Job Search
Search: City/Role from Step 1

EXPECTED:
✅ GET /api/sync?type=live-jobs called
✅ Job from Step 1 appears in results
✅ Job is visible (not grayed out)
✅ "Apply" button is active

VERIFY: Job appears in search results
```

---

## COMMON FAILURE POINTS

### Issue: Admin login succeeds but token not saved
**Check:**
1. Admin-context.tsx line 192 - localStorage.setItem is called
2. ADMIN_SESSION_KEY constant is defined
3. DevTools → Application → Local Storage shows key

**Fix if missing:**
```
localStorage.setItem('salonjobsindia_admin_session', JSON.stringify({
  isAuthenticated: true,
  token: 'admin_token_' + Date.now(),
  email,
  expiresAt,
}))
```

---

### Issue: Admin pending jobs returns 401 Unauthorized
**Check:**
1. Token is in localStorage (see above)
2. getAdminToken() function exists (use-realtime-sync.ts line 5-18)
3. Authorization header is being sent (use-realtime-sync.ts line 106)
4. Endpoint checks token format (admin/pending-jobs/route.ts line 10)

**Fix if 401:**
```
1. Open DevTools → Network
2. Find /api/admin/pending-jobs request
3. Check Request Headers:
   - Authorization: Bearer admin_token_XXXXXXX should be present
4. If missing: getAdminToken() returning null
   → Token not in localStorage
   → Login didn't save token
```

---

### Issue: Admin sees empty pending list but job was submitted
**Check:**
1. Job created with status='PAYMENT_PENDING' (sync/route.ts line 93)
2. Job created with payment_status='pending' (sync/route.ts line 94)
3. getPendingJobs() queries for both values (db/jobs.ts line 124-125)
4. Response mapping doesn't filter results (admin/pending-jobs/route.ts line 31)

**Fix if empty:**
```
Verify Supabase query:
- SELECT * FROM jobs 
- WHERE status = 'PAYMENT_PENDING'
- AND payment_status = 'pending'
- ORDER BY payment_submitted_at DESC

If returns 0 rows:
→ Job creation failed silently
→ Check /api/sync response (should show error)
→ Check Supabase logs
```

---

### Issue: Approval fails (401 Unauthorized)
**Check:**
1. Authorization header is sent (use-realtime-sync.ts line 239)
2. Token is valid (not expired)
3. Endpoint accepts token (jobs/approve/route.ts checks auth)

**Fix if 401:**
```
1. Check Network tab for /api/jobs/approve
2. Verify Authorization header present
3. If job still PAYMENT_PENDING:
   → Approval failed
   → Check response error message
```

---

## DEBUGGING COMMANDS

### Check Supabase for pending jobs:
```sql
SELECT id, status, payment_status, is_visible, salon_name
FROM jobs
WHERE status = 'PAYMENT_PENDING'
AND payment_status = 'pending'
ORDER BY created_at DESC;
```

### Check Supabase for approved jobs:
```sql
SELECT id, status, payment_status, is_visible, salon_name
FROM jobs
WHERE status = 'LIVE'
AND payment_status = 'approved'
AND is_visible = true
ORDER BY created_at DESC;
```

### Check localStorage for admin session:
```javascript
JSON.parse(localStorage.getItem('salonjobsindia_admin_session'))
// Should return: {isAuthenticated: true, token: 'admin_token_...', email, expiresAt}
```

---

## COMPLETE WORKFLOW TIMELINE

```
T+0s:   User fills job form
T+5s:   User uploads screenshot → Creates payment form
T+10s:  User clicks Submit Payment
T+11s:  POST /api/sync {type: 'job-payment'}
T+12s:  Job created in Supabase (PAYMENT_PENDING)
T+13s:  Response: {success: true, jobId}
T+15s:  Front-end shows "Pending Approval" screen

T+30s:  Admin navigates to /admin
T+31s:  Admin enters credentials
T+31.5s: login() generates token → localStorage
T+32s:  Admin dashboard loads
T+33s:  User clicks "Pending Payments"
T+34s:  GET /api/admin/pending-jobs WITH token
T+35s:  Server returns: [{job}]
T+36s:  Admin sees job in list

T+40s:  Admin clicks "Approve"
T+41s:  POST /api/jobs/approve WITH token
T+42s:  Job updates: status='LIVE', is_visible=true
T+43s:  Response: {success: true}
T+44s:  Admin sees "Approved" status

T+60s:  Customer searches jobs
T+61s:  GET /api/sync?type=live-jobs
T+62s:  Server returns: [{job}] (now LIVE and visible)
T+63s:  Customer sees job in results
T+65s:  Customer can apply
```

---

## MANUAL TEST PLAN

### Test 1: Salon Owner Workflow
- [ ] Navigate to app
- [ ] Select "Salon Owner"
- [ ] Fill all job form fields
- [ ] Upload logo
- [ ] Detect location
- [ ] Go to payment step
- [ ] Upload screenshot
- [ ] Click Submit
- [ ] Verify console: "[Realtime Sync] Submitting job payment"
- [ ] Verify Supabase: New job with PAYMENT_PENDING status

### Test 2: Admin Login Workflow
- [ ] Navigate to /admin
- [ ] Enter: admin@salonjobsindia.com / admin123
- [ ] Click Sign In
- [ ] Verify redirected to dashboard
- [ ] Verify localStorage has session key with token
- [ ] Open DevTools → Application → Local Storage
- [ ] Confirm 'salonjobsindia_admin_session' exists

### Test 3: Admin Pending Payments Workflow
- [ ] Click "Pending Payments" tab
- [ ] Open DevTools → Network
- [ ] Verify GET /api/admin/pending-jobs request
- [ ] Check request headers: Authorization Bearer token
- [ ] Check response status: 200 OK
- [ ] Verify job from Test 1 appears in list

### Test 4: Admin Approval Workflow
- [ ] In pending payments list
- [ ] Click "Approve" on a job
- [ ] Open DevTools → Network
- [ ] Verify POST /api/jobs/approve request
- [ ] Check headers: Authorization Bearer token
- [ ] Check response status: 200 OK
- [ ] Verify job status changes to "Approved"

### Test 5: Customer Search Workflow
- [ ] Navigate to app (new session)
- [ ] Select "Job Seeker"
- [ ] Go to "Job Search"
- [ ] Search for city/role from approved job
- [ ] Verify approved job appears
- [ ] Verify "Apply" button is clickable

---

## IF TESTS FAIL

**If Test 1 fails (submission fails):**
- Check /api/sync endpoint
- Check console error message
- Verify Supabase connection

**If Test 2 fails (login doesn't save token):**
- Check admin-context.tsx login function
- Check localStorage.setItem is called
- Check ADMIN_SESSION_KEY value

**If Test 3 fails (empty pending list):**
- Check Supabase has job with correct status
- Check getAdminToken() returns token
- Check Authorization header is sent

**If Test 4 fails (approval fails):**
- Check token is valid
- Check Authorization header is sent
- Check /api/jobs/approve endpoint exists

**If Test 5 fails (job not visible):**
- Check approval actually updated Supabase
- Check is_visible=true in database
- Check getLiveJobs() query

