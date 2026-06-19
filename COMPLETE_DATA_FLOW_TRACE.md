# COMPLETE DATA FLOW TRACE - Salon Owner → Admin → Job Seeker

## STEP 1: SALON OWNER SUBMITS JOB PAYMENT

**File:** `components/customer/create-job.tsx` Line 23-40
**Action:** Calls `submitJobPayment()`
**Data Passed:**
```js
{
  salonId: user?.id,
  salonName,
  ownerName: user?.name,
  ownerPhone: user?.phone,
  ownerEmail: user?.email,
  jobTitle,
  jobDetails: { ...formData, salary, experience, location },
  planId: 'single_job_post',
  planName: 'Job Posting',
  planPrice: JOB_POST_PRICE,
  screenshotUrl: paymentScreenshot
}
```

## STEP 2: SUBMITJOBPAYMENT SENDS TO API

**File:** `lib/hooks/use-realtime-sync.ts` Line 468-507
**Endpoint:** POST `/api/sync`
**Payload:**
```js
{
  type: 'job-payment',
  data: { id, ...data }
}
```

## STEP 3: /API/SYNC SAVES TO DATABASE

**File:** `app/api/sync/route.ts` Line 138-211
**What Gets Saved to `jobs` collection:**
```js
const job = new Job({
  ownerId: data.salonId,              // ✅ Salon owner ID
  title: data.jobTitle,               // ✅ Job title
  description: data.jobDetails?.description,
  salonName: data.salonName,
  jobType: data.jobDetails?.jobType,
  skills: data.jobDetails?.skills,
  experienceRequired: data.jobDetails?.experience,
  salary: { min: 0, max: 0, currency: 'INR', period: 'monthly' },
  location: {
    type: 'Point',
    coordinates: [data.jobDetails?.location?.lng || 0, data.jobDetails?.location?.lat || 0],
    address: data.jobDetails?.location?.address,
    city: data.jobDetails?.location?.city,
    state: data.jobDetails?.location?.state
  },
  requirements: [],
  benefits: [],
  status: 'PAYMENT_PENDING',           // ✅ CORRECT STATUS
  paymentStatus: 'pending',            // ✅ CORRECT STATUS
  visibility: 'private',
  isLive: false,
  isVisible: false,
  paymentScreenshotUrl: data.screenshotUrl,  // ✅ SCREENSHOT SAVED
  paymentAmount: data.planPrice,            // ✅ AMOUNT SAVED
  paymentPlan: data.planName,               // ✅ PLAN SAVED
  paymentSubmittedAt: new Date(),
  postedAt: new Date()
})

await job.save()  // ✅ SAVED TO DATABASE
```

**Debug Output:**
```
[v0] [Sync API] Creating job with status=PAYMENT_PENDING, paymentStatus=pending
[Sync API] Job payment submitted: {paymentId} for job: {jobId}
```

## STEP 4: ADMIN QUERIES PENDING JOBS

**File:** `app/api/admin/pending-jobs/route.ts` Line 13-21
**Query:**
```js
const pendingJobs = await Job.find({
  status: 'PAYMENT_PENDING',  // ✅ MATCHES what was saved
  paymentStatus: 'pending'    // ✅ MATCHES what was saved
})
.populate('ownerId', 'email phone name')
.sort({ paymentSubmittedAt: -1 })
.lean()
```

**Expected Result:**
```
[v0] [Admin Pending] Found X jobs
```

**Mapping to Admin Format (Line 25-44):**
- jobId: job._id
- salonName: job.salonName
- ownerName: (job.ownerId as any)?.name
- ownerPhone: (job.ownerId as any)?.phone
- ownerEmail: (job.ownerId as any)?.email
- jobTitle: job.title
- planName: job.paymentPlan
- planPrice: job.paymentAmount
- screenshotUrl: job.paymentScreenshotUrl
- status: 'pending'
- createdAt: job.paymentSubmittedAt

## STEP 5: ADMIN CLICKS APPROVE

**File:** `components/admin/admin-payments.tsx` Line 52
**Calls:** `approveJobPayment(confirmAction.id)`

## STEP 6: APPROVE JOB PAYMENT HOOK

**File:** `lib/hooks/use-realtime-sync.ts` Line 170-194
**Endpoint Called:** POST `/api/jobs/approve`
**Payload:**
```js
{
  jobId: id,           // Job ID from admin list
  action: 'approve',
  adminId              // Admin user ID
}
```

## STEP 7: /API/JOBS/APPROVE UPDATES JOB

**File:** `app/api/jobs/approve/route.ts` Line 29-80
**Atomic Update (with Mongoose session):**
```js
const updatedJob = await Job.findByIdAndUpdate(
  jobId,
  {
    status: 'LIVE',                    // ✅ Changed from PAYMENT_PENDING
    paymentStatus: 'approved',         // ✅ Changed from pending
    visibility: 'public',              // ✅ Changed from private
    isLive: true,                      // ✅ Changed from false
    isVisible: true,                   // ✅ Changed from false
    approvedBy: new ObjectId(adminId),
    approvedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  { session, new: true }
)

await session.commitTransaction()  // ✅ ATOMIC COMMIT
```

**Debug Output:**
```
[v0] Job status before approval: PAYMENT_PENDING, paymentStatus: pending
[v0] Approving job {jobId} - updating status PAYMENT_PENDING → LIVE
[v0] Job updated, new status: LIVE, paymentStatus: approved
[v0] Job approved and made live: {jobId}
```

## STEP 8: JOB SEEKER QUERIES FOR LIVE JOBS

**File:** `app/api/jobs/route.ts` Line 19-23
**Query:**
```js
const query: any = {
  status: 'LIVE',              // ✅ MATCHES what admin set
  isVisible: true,             // ✅ MATCHES what admin set
  paymentStatus: 'approved'    // ✅ MATCHES what admin set
}
```

**Expected Result:**
```
[v0] [Job Seeker] Query filters: {...}
[v0] [Job Seeker] Total matching jobs: X
```

**Returns to Job Seeker:**
- Job title
- Job description
- Salon name
- Location
- Salary
- Skills
- And other job details

## COMPLETE FLOW VERIFICATION

✅ **Salon owner writes:** status='PAYMENT_PENDING', paymentStatus='pending'
✅ **Admin queries for:** status='PAYMENT_PENDING', paymentStatus='pending'  → MATCH
✅ **Admin approves sets:** status='LIVE', paymentStatus='approved'
✅ **Job seeker queries for:** status='LIVE', paymentStatus='approved' → MATCH
✅ **Job seeker sees:** Approved live jobs

## SINGLE SOURCE OF TRUTH

All data flows through ONE `jobs` collection with consistent status values:

**Status Values Everywhere:**
- When submitted: `status='PAYMENT_PENDING'`, `paymentStatus='pending'`
- When approved: `status='LIVE'`, `paymentStatus='approved'`, `visibility='public'`, `isVisible=true`
- When rejected: `status='DRAFT'`, `paymentStatus='rejected'`, `visibility='private'`, `isVisible=false`

**All Queries Match:**
- Salon owner saves with these exact values
- Admin queries for these exact values
- Approval endpoint sets these exact values
- Job seeker queries for these exact values

## CONCLUSION

The data flow is correctly implemented with:
1. ✅ Single jobs collection (single source of truth)
2. ✅ Consistent status values everywhere
3. ✅ Atomic transactions for approval
4. ✅ Debug logging at every step
5. ✅ Real-time sync (fetchPending called after approval)

If jobs are not reaching admin or going live to seekers, the issue is either:
1. Database connection error (check MongoDB URL)
2. Permission/RLS rules blocking access
3. Client-side issue (admin list not calling refre or using stale data)
4. Frontend not displaying the data returned by API
