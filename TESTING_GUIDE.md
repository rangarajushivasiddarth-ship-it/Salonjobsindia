# 🧪 COMPREHENSIVE TESTING GUIDE
## Salon Jobs India - Pre-Deployment Verification

---

## PART 1: SECURITY BOUNDARY TESTING

### Test Case 1.1: Admin Endpoint Access Control
**Objective:** Verify only admins can view pending jobs

**Setup:**
- Have 3 test users: job_seeker, salon_owner, admin
- Generate JWT tokens for each role

**Test Steps:**

1. **Anonymous Access (Should FAIL - 401)**
   ```bash
   curl -X GET http://localhost:3000/api/admin/pending-jobs
   ```
   Expected: `{"error":"Unauthorized: Invalid or missing token"}`

2. **Job Seeker Access (Should FAIL - 403)**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer {job_seeker_token}" \
     http://localhost:3000/api/admin/pending-jobs
   ```
   Expected: `{"error":"Forbidden: Requires admin role"}`

3. **Salon Owner Access (Should FAIL - 403)**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer {salon_owner_token}" \
     http://localhost:3000/api/admin/pending-jobs
   ```
   Expected: `{"error":"Forbidden: Requires admin role"}`

4. **Admin Access (Should SUCCEED - 200)**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer {admin_token}" \
     http://localhost:3000/api/admin/pending-jobs
   ```
   Expected: `{"success":true,"data":[...],"count":X}`

**Pass Criteria:**
- ✅ Anonymous users get 401
- ✅ Non-admin users get 403
- ✅ Admin users get 200 with data

---

### Test Case 1.2: Payment Approval Access Control
**Objective:** Verify only admins can approve job payments

**Setup:**
- Have a pending job in database (status: 'PAYMENT_PENDING')
- Test user tokens for all roles

**Test Steps:**

1. **Anonymous Approval (Should FAIL - 401)**
   ```bash
   curl -X PUT \
     -H "Content-Type: application/json" \
     -d '{
       "jobId":"test-job-123",
       "action":"approve",
       "adminId":"test-admin-456"
     }' \
     http://localhost:3000/api/sync
   ```
   Expected: `{"error":"Unauthorized: Invalid or missing token"}`

2. **Job Seeker Approval (Should FAIL - 403)**
   ```bash
   curl -X PUT \
     -H "Authorization: Bearer {job_seeker_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "jobId":"test-job-123",
       "action":"approve"
     }' \
     http://localhost:3000/api/sync
   ```
   Expected: `{"error":"Forbidden: Requires admin role"}`

3. **Admin Approval (Should SUCCEED - 200)**
   ```bash
   curl -X PUT \
     -H "Authorization: Bearer {admin_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "jobId":"test-job-123",
       "action":"approve"
     }' \
     http://localhost:3000/api/sync
   ```
   Expected: `{"success":true,"message":"Job approved and now LIVE"}`

4. **Verify Admin ID from Token (NOT from body)**
   - The response should log the admin ID from the token
   - The database should record the authenticated admin ID
   - The request body adminId should be IGNORED

**Pass Criteria:**
- ✅ Anonymous gets 401
- ✅ Non-admin gets 403
- ✅ Admin can approve
- ✅ Admin ID comes from token, not request body

---

### Test Case 1.3: Payment Rejection Access Control
**Objective:** Verify only admins can reject job payments

**Test Steps:** (Same as 1.2 but with action: 'reject')

```bash
curl -X PUT \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId":"test-job-123",
    "action":"reject",
    "reason":"Invalid payment proof"
  }' \
  http://localhost:3000/api/sync
```

Expected: `{"success":true,"message":"Job rejected"}`

**Pass Criteria:**
- ✅ Admin can reject with reason
- ✅ Job status updates to 'REJECTED'
- ✅ Reason is stored for audit

---

## PART 2: WORKFLOW TESTING

### Test Case 2.1: Job Seeker Workflow
**Objective:** Verify complete job seeker experience

**Test Steps:**

1. **Register as Job Seeker**
   ```bash
   POST /api/auth/register
   {
     "email": "seeker@test.com",
     "password": "password123",
     "name": "Test Seeker",
     "role": "job_seeker"
   }
   ```
   Expected: User created with role: 'job_seeker'

2. **Browse Approved Jobs (Should see only approved)**
   ```bash
   GET /api/jobs?page=1&limit=20
   ```
   Verification:
   - ✅ All returned jobs have status = 'LIVE'
   - ✅ All returned jobs have is_visible = true
   - ✅ No PAYMENT_PENDING jobs returned
   - ✅ No REJECTED jobs returned

3. **Add Favorite Job**
   ```bash
   POST /api/sync/favorites
   {
     "jobId": "approved-job-123",
     "userId": "seeker-user-id",
     "queueId": "favorite-queue-001"
   }
   ```
   Expected: Favorite stored in job_seeker_favorites

4. **Verify Favorite Persists**
   ```bash
   GET /api/job-seekers?ownerId=seeker-user-id
   ```
   Check favorites field includes the job

**Pass Criteria:**
- ✅ Cannot see pending/rejected jobs
- ✅ Can add favorites
- ✅ Favorites persist
- ✅ Cannot access admin endpoints

---

### Test Case 2.2: Salon Owner Workflow
**Objective:** Verify complete salon owner experience

**Test Steps:**

1. **Register as Salon Owner**
   ```bash
   POST /api/auth/register
   {
     "email": "owner@test.com",
     "password": "password123",
     "name": "Test Owner",
     "role": "salon_owner"
   }
   ```
   Expected: User created with role: 'salon_owner'

2. **Create Job with Payment**
   ```bash
   POST /api/sync
   {
     "type": "job-payment",
     "data": {
       "salonId": "owner-user-id",
       "salonName": "Test Salon",
       "jobTitle": "Hairdresser",
       "screenshotUrl": "https://...",
       "planName": "job_publishing",
       "planPrice": 499,
       "jobDetails": {
         "description": "Full-time hairdresser needed",
         "skills": ["cutting", "coloring"],
         "salary": {"min": 15000, "max": 25000},
         "location": {"city": "Delhi", "address": "..."}
       }
     }
   }
   ```
   Expected:
   - ✅ Job created with status: 'PAYMENT_PENDING'
   - ✅ Job has is_visible: false
   - ✅ Payment screenshot stored
   - ✅ Returns jobId in response

3. **View Own Jobs (pending & approved)**
   ```bash
   GET /api/jobs?ownerId=owner-user-id
   ```
   Verification:
   - ✅ Can see own PAYMENT_PENDING jobs
   - ✅ Can see own LIVE jobs
   - ✅ Cannot see other owners' jobs

4. **Update Profile (Offline Sync)**
   ```bash
   PUT /api/sync/profile-updates
   {
     "userId": "owner-user-id",
     "role": "salon_owner",
     "profileData": {
       "salonName": "Updated Salon Name",
       "phone": "+91-9876543210",
       "address": "New Address"
     },
     "queueId": "profile-update-001"
   }
   ```
   Expected:
   - ✅ Profile updated in salon_owners collection
   - ✅ updatedAt timestamp recorded
   - ✅ Returns modifiedCount in response

**Pass Criteria:**
- ✅ Can create jobs (payment pending)
- ✅ Jobs not visible until approved
- ✅ Can update profile
- ✅ Cannot approve own jobs
- ✅ Cannot access admin panel

---

### Test Case 2.3: Admin Workflow
**Objective:** Verify complete admin experience

**Test Steps:**

1. **Login as Admin**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@salon-jobs.com",
     "password": "admin-password"
   }
   ```
   Expected: JWT token with role: 'admin'

2. **View Pending Jobs**
   ```bash
   GET /api/admin/pending-jobs \
     -H "Authorization: Bearer {admin_token}"
   ```
   Expected:
   - ✅ Returns all jobs with status: 'PAYMENT_PENDING'
   - ✅ Includes payment screenshot URLs
   - ✅ Includes salon owner details
   - ✅ Ordered by creation date

3. **Approve Job Payment**
   ```bash
   PUT /api/sync \
     -H "Authorization: Bearer {admin_token}"
   {
     "jobId": "job-123",
     "action": "approve"
   }
   ```
   Expected:
   - ✅ Job status → 'LIVE'
   - ✅ Job is_visible → true
   - ✅ Job visibility → 'public'
   - ✅ Payment status → 'approved'
   - ✅ Job now visible to job seekers

4. **Verify Job is Now Visible to Seekers**
   ```bash
   GET /api/jobs?search=specific-job-title
   ```
   Expected: ✅ Approved job appears in search results

5. **Reject Payment**
   ```bash
   PUT /api/sync \
     -H "Authorization: Bearer {admin_token}"
   {
     "jobId": "job-456",
     "action": "reject",
     "reason": "Incomplete payment proof"
   }
   ```
   Expected:
   - ✅ Job status → 'REJECTED'
   - ✅ Job remains private (owner can see it)
   - ✅ Reason recorded for audit trail

**Pass Criteria:**
- ✅ Can view all pending jobs
- ✅ Can approve jobs (makes visible)
- ✅ Can reject jobs with reason
- ✅ Admin ID traced from token
- ✅ All actions logged

---

## PART 3: BACKGROUND SYNC TESTING

### Test Case 3.1: Job Submission Sync
**Objective:** Verify offline job submission queues and syncs

**Test Steps:**

1. **Simulate Offline Mode**
   - Open browser DevTools
   - Go to Network tab
   - Select "Offline" option
   - Stay in application

2. **Create Job While Offline**
   ```javascript
   // In browser console (offline mode)
   const jobData = {
     salonName: "Offline Salon",
     jobTitle: "Makeup Artist",
     description: "Full-time makeup artist",
     owner_id: "user-id"
   };
   
   // This should queue in localStorage
   // App shows: "Offline - Job queued for sync"
   ```

3. **Verify Queue in localStorage**
   ```javascript
   // In browser console (still offline)
   console.log(JSON.parse(localStorage.getItem('sync_queue')));
   // Should show queued job
   ```

4. **Go Back Online**
   - Change Network tab to "Online"
   - Trigger sync manually or wait for auto-sync

5. **Verify Sync Processed**
   ```bash
   POST /api/sync/job-submissions
   {
     "jobData": {...},
     "queueId": "queue-001"
   }
   ```
   Expected:
   - ✅ Job created with status: 'PAYMENT_PENDING'
   - ✅ Response: `{"success":true,"jobId":"..."}`
   - ✅ localStorage queue cleared
   - ✅ UI shows: "Sync complete"

**Pass Criteria:**
- ✅ Jobs queue in localStorage when offline
- ✅ Sync processes when online
- ✅ Job appears in database
- ✅ Queue clears after successful sync

---

### Test Case 3.2: Profile Update Sync
**Objective:** Verify offline profile updates sync

**Test Steps:**

1. **Update Profile Offline**
   ```javascript
   // In browser console (offline mode)
   const profileUpdate = {
     userId: "owner-user-id",
     role: "salon_owner",
     profileData: {
       salonName: "Updated Name",
       phone: "+91-123456"
     }
   };
   // Should queue in localStorage
   ```

2. **Go Online and Sync**
   ```bash
   POST /api/sync/profile-updates \
     -H "Authorization: Bearer {token}"
   {
     "userId": "owner-user-id",
     "role": "salon_owner",
     "profileData": {...},
     "queueId": "profile-001"
   }
   ```
   Expected:
   - ✅ Profile updated in MongoDB
   - ✅ modifiedCount > 0 in response
   - ✅ updatedAt timestamp recorded

**Pass Criteria:**
- ✅ Profile changes queue offline
- ✅ Sync completes successfully
- ✅ MongoDB contains updates
- ✅ Timestamps recorded

---

### Test Case 3.3: Favorites Sync
**Objective:** Verify offline favorites sync

**Test Steps:**

1. **Add Favorite While Offline**
   ```javascript
   // Browser console (offline)
   const favorite = {
     jobId: "job-123",
     userId: "seeker-id"
   };
   // Queued to localStorage
   ```

2. **Sync When Online**
   ```bash
   POST /api/sync/favorites
   {
     "jobId": "job-123",
     "userId": "seeker-id",
     "queueId": "fav-001"
   }
   ```
   Expected:
   - ✅ Stored in job_seeker_favorites collection
   - ✅ Returns insertedId if new
   - ✅ Returns existing if duplicate

**Pass Criteria:**
- ✅ Favorites queue offline
- ✅ Sync completes successfully
- ✅ Duplicates prevented
- ✅ MongoDB persists data

---

## PART 4: VISIBILITY ENFORCEMENT TESTING

### Test Case 4.1: Job Visibility Database Level
**Objective:** Verify only approved jobs returned from database

**Setup:**
- Create 3 jobs:
  - Job A: status='LIVE', is_visible=true (VISIBLE)
  - Job B: status='PAYMENT_PENDING', is_visible=false (NOT VISIBLE)
  - Job C: status='REJECTED', is_visible=false (NOT VISIBLE)

**Test:**
```bash
GET /api/jobs
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    { "id": "job-a", "title": "...", "status": "LIVE" }
  ],
  "pagination": { "totalCount": 1 }
}
```

**Verification:**
- ✅ Only Job A returned
- ✅ Jobs B and C not included
- ✅ Count is 1 (not 3)

**Pass Criteria:**
- ✅ Pending jobs hidden from seekers
- ✅ Rejected jobs hidden from seekers
- ✅ Only LIVE jobs returned
- ✅ Visibility enforced at database level

---

### Test Case 4.2: Role-Based Data Access
**Objective:** Verify each role sees appropriate data

**Test Setup:**
- Job Seeker User: seeker@test.com
- Salon Owner 1: owner1@test.com (with 2 jobs)
- Salon Owner 2: owner2@test.com (with 2 jobs)
- Admin: admin@test.com

**Test Matrix:**

| Query | By | Should See | Should NOT See |
|-------|----|-----------| --------------|
| GET /api/jobs | Job Seeker | Approved jobs | All pending jobs |
| GET /api/jobs | Owner1 | Own jobs + approved others | Owner2's pending jobs |
| GET /api/admin/pending-jobs | Owner1 | 403 Error | Any data |
| GET /api/admin/pending-jobs | Admin | All pending jobs | Nothing hidden |

---

## PART 5: DATA INTEGRITY TESTING

### Test Case 5.1: Duplicate Prevention
**Objective:** Verify system prevents duplicate favorites

**Test Steps:**

1. **Add Favorite (First Time)**
   ```bash
   POST /api/sync/favorites
   {
     "jobId": "job-xyz",
     "userId": "seeker-123",
     "queueId": "fav-001"
   }
   ```
   Response: `{"success":true,"insertedId":"mongo-id-123"}`

2. **Add Same Favorite Again**
   ```bash
   POST /api/sync/favorites
   {
     "jobId": "job-xyz",
     "userId": "seeker-123",
     "queueId": "fav-002"
   }
   ```
   Response: `{"success":true,"alreadyExists":true,"message":"Favorite already exists"}`

**Pass Criteria:**
- ✅ First add succeeds with insertedId
- ✅ Second add detected as duplicate
- ✅ No duplicate record created
- ✅ Proper error response

---

## PART 6: ERROR HANDLING TESTING

### Test Case 6.1: Missing Required Fields
**Objective:** Verify proper error messages for invalid input

**Test 1: Missing jobData**
```bash
POST /api/sync/job-submissions
{
  "queueId": "queue-001"
}
```
Expected: `400 Bad Request - Missing jobData or queueId`

**Test 2: Missing salonName**
```bash
POST /api/sync/job-submissions
{
  "jobData": {
    "jobTitle": "Role"
  },
  "queueId": "queue-001"
}
```
Expected: `400 Bad Request - Missing required job fields`

**Test 3: Missing owner_id**
```bash
POST /api/sync/job-submissions
{
  "jobData": {
    "jobTitle": "Role",
    "salonName": "Salon"
  },
  "queueId": "queue-001"
}
```
Expected: `400 Bad Request - Missing owner_id`

**Pass Criteria:**
- ✅ All missing field cases return 400
- ✅ Error messages are clear
- ✅ No data created on invalid input
- ✅ Proper error logging

---

## PART 7: AUDIT LOGGING TESTING

### Test Case 7.1: Admin Actions Logged
**Objective:** Verify all admin actions recorded for audit

**Test Steps:**

1. **Admin Approves Job**
   ```bash
   PUT /api/sync
   -H "Authorization: Bearer {admin_token}"
   {
     "jobId": "job-123",
     "action": "approve"
   }
   ```

2. **Check Audit Logs**
   ```bash
   GET /api/sync?type=sync-logs
   ```
   Expected Response includes:
   ```json
   {
     "action": "approve",
     "jobId": "job-123",
     "adminId": "admin-user-123",
     "status": "success",
     "timestamp": "2026-06-19T10:30:00Z"
   }
   ```

**Pass Criteria:**
- ✅ All approvals logged
- ✅ Admin ID recorded
- ✅ Timestamp included
- ✅ Action type captured

---

## CHECKLIST: All Tests Must Pass

### Security Tests
- [ ] Test 1.1: Admin endpoint access control
- [ ] Test 1.2: Payment approval access control
- [ ] Test 1.3: Payment rejection access control

### Workflow Tests
- [ ] Test 2.1: Job seeker workflow
- [ ] Test 2.2: Salon owner workflow
- [ ] Test 2.3: Admin workflow

### Sync Tests
- [ ] Test 3.1: Job submission sync
- [ ] Test 3.2: Profile update sync
- [ ] Test 3.3: Favorites sync

### Visibility Tests
- [ ] Test 4.1: Job visibility database level
- [ ] Test 4.2: Role-based data access

### Integrity Tests
- [ ] Test 5.1: Duplicate prevention

### Error Handling Tests
- [ ] Test 6.1: Missing required fields

### Audit Tests
- [ ] Test 7.1: Admin actions logged

---

## Deployment Decision

**Deploy only if:**
- ✅ All security tests pass
- ✅ All workflow tests pass
- ✅ All sync tests pass
- ✅ No error responses unexpected
- ✅ Admin actions properly logged

**Do NOT deploy if:**
- ❌ Any security boundary fails
- ❌ Non-admin can access admin endpoints
- ❌ Non-admin can approve payments
- ❌ Sync operations fail
- ❌ Invalid input not caught

---

Generated: June 19, 2026
