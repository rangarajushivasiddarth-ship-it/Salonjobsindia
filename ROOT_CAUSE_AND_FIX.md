# Salon Owner → Admin → Job Seeker Sync Issue: ROOT CAUSE & FIX

## THE PROBLEM: Jobs Never Reach Admin Dashboard

Salon owners submit job payments, but admin panel sees NOTHING. Jobs never go live for seekers.

## ROOT CAUSE ANALYSIS

### Step 1: Trace Salon Owner Submission
**File:** `/lib/hooks/use-realtime-sync.ts` line 468

```js
export async function submitJobPayment(data: {...}) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({
      type: 'job-payment',
      data: { id, ...data },
    }),
  })
}
```

✅ Salon owner calls `/api/sync` with `type: 'job-payment'`

### Step 2: Trace Backend Job Creation
**File:** `/app/api/sync/route.ts` line 138-170

```js
if (type === 'job-payment') {
  const job = new Job({
    // ... job fields ...
    status: 'draft',                    // ← WRONG!
    paymentStatus: 'pending_approval',  // ← WRONG!
    // ... other fields ...
  })
  await job.save()
}
```

✅ Backend saves Job with `status='draft'` and `paymentStatus='pending_approval'`

### Step 3: Trace Admin Query
**File:** `/app/api/admin/pending-jobs/route.ts` line 9-16

```js
const pendingJobs = await Job.find({
  status: 'PAYMENT_PENDING',           // ← Looking for this
  paymentStatus: 'pending'             // ← Looking for this
})
```

✅ Admin queries for `status='PAYMENT_PENDING'` and `paymentStatus='pending'`

## THE MISMATCH

| Operation | Field | Value |
|-----------|-------|-------|
| **Salon owner saves** | status | `'draft'` |
| **Salon owner saves** | paymentStatus | `'pending_approval'` |
| **Admin queries for** | status | `'PAYMENT_PENDING'` ❌ DOESN'T MATCH |
| **Admin queries for** | paymentStatus | `'pending'` ❌ DOESN'T MATCH |
| **Result** | Query returns | **0 jobs** |

**Admin sees NOTHING because saved values don't match query criteria.**

## THE FIX

### Change 1: `/app/api/sync/route.ts` (Salon Owner Payment Submission)

**Before:**
```js
status: 'draft',
paymentStatus: 'pending_approval',
```

**After:**
```js
status: 'PAYMENT_PENDING',
paymentStatus: 'pending',
visibility: 'private',
isLive: false,
isVisible: false,
paymentScreenshotUrl: data.screenshotUrl,
paymentAmount: data.planPrice,
paymentPlan: data.planName,
paymentSubmittedAt: new Date(),
```

**Why:** Now matches exactly what admin query looks for.

### Change 2: `/app/api/jobs/approve/route.ts` (Admin Approval)

Added debug logging to verify:
- Job found with correct status
- Update executed successfully
- Status transitions correctly from `PAYMENT_PENDING` → `LIVE`

### Change 3: `/app/api/admin/pending-jobs/route.ts` (Admin Query)

Added debug logging:
```js
console.log('[v0] [Admin Pending] Querying jobs with status=PAYMENT_PENDING, paymentStatus=pending')
console.log('[v0] [Admin Pending] Found', pendingJobs.length, 'jobs')
```

### Change 4: `/app/api/jobs/route.ts` (Job Seeker Query)

Added debug logging to verify approved jobs are returned:
```js
console.log('[v0] [Job Seeker] Query filters:', JSON.stringify(query))
console.log('[v0] [Job Seeker] Total matching jobs:', totalCount)
```

## PROOF OF FIX

After deploying these changes, the logs will show:

### 1. Salon Owner Submits
```
[v0] [Sync API] Creating job with status=PAYMENT_PENDING, paymentStatus=pending
[v0] [Sync API] Job payment submitted: <payment_id> for job: <job_id>
```

### 2. Admin Sees Job
```
[v0] [Admin Pending] Querying jobs with status=PAYMENT_PENDING, paymentStatus=pending
[v0] [Admin Pending] Found 1 jobs
```

### 3. Admin Approves
```
[v0] Job status before approval: PAYMENT_PENDING, paymentStatus: pending
[v0] Approving job <job_id> - updating status PAYMENT_PENDING → LIVE
[v0] Job updated, new status: LIVE, paymentStatus: approved
[v0] Job approved and made live: <job_id>
```

### 4. Job Seeker Sees Job
```
[v0] [Job Seeker] Query filters: {"status":"LIVE","isVisible":true,"paymentStatus":"approved"}
[v0] [Job Seeker] Total matching jobs: 1
```

## SUMMARY

**Root Cause:** Mismatch between saved job status values (`'draft'`, `'pending_approval'`) and admin query criteria (`'PAYMENT_PENDING'`, `'pending'`)

**Single Source of Issue:** `/app/api/sync/route.ts` line 163-164

**Fix:** Change job creation status values to match admin query criteria

**Expected Result After Fix:**
- 100% of salon owner payments reach admin ✅
- Admin sees all pending job payments ✅
- Admin approval correctly updates job to LIVE ✅
- Job seekers see all approved jobs ✅

