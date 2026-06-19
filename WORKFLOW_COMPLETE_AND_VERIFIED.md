# Salon Owner → Admin → Job Seeker Workflow - COMPLETE & VERIFIED

## Status: ✅ PRODUCTION READY

The complete end-to-end workflow is now **fully functional and verified** across all three user flows.

---

## Root Cause Analysis

### The Problem
The salon owner → admin → job seeker workflow was breaking at the rejection step because:

1. **Database Constraint Mismatch**: The Supabase `jobs` table has a PostgreSQL CHECK constraint:
   ```sql
   status TEXT CHECK (status IN ('DRAFT', 'PAYMENT_PENDING', 'APPROVED', 'LIVE', 'EXPIRED', 'CLOSED'))
   ```

2. **Code Using Invalid Status**: The rejection code was trying to set `status='REJECTED'` which is **NOT** in the allowed list, causing the update to fail silently.

3. **Silent Failure**: Without proper error handling visible at the API level, the rejection appeared to succeed but actually failed in the database.

### The Solution
- Changed rejection to use `status='EXPIRED'` (which IS in the allowed enum)
- Combined with `payment_status='rejected'` for semantic tracking
- Set `is_visible=false` to hide rejected jobs from job seekers
- Preserved `rejection_reason` field for audit trail

---

## Complete Verified Workflow

### FLOW 1: APPROVAL WORKFLOW ✅

```
1. Salon Owner Submits Job
   └─ POST /api/sync (type: "job-payment")
   └─ Saved: status=PAYMENT_PENDING, payment_status=pending, is_visible=false
   └─ Response: jobId, full job object

2. Admin Sees Pending Jobs
   └─ GET /api/admin/pending-jobs
   └─ Query: status=PAYMENT_PENDING AND payment_status=pending
   └─ Response: List of all pending jobs

3. Admin Approves Payment
   └─ PUT /api/sync (action: "approve")
   └─ Updated: status=LIVE, payment_status=approved, is_visible=true
   └─ Response: Updated job object

4. Job Seeker Finds Approved Job
   └─ GET /api/jobs?city=Delhi&search=...
   └─ Query: status=LIVE AND is_visible=true AND payment_status=approved
   └─ Response: Job appears in search results

5. Result: JOB LIVE FOR SEEKERS ✓
```

### FLOW 2: REJECTION WORKFLOW ✅

```
1. Salon Owner Submits Job
   └─ Same as Flow 1

2. Admin Sees Pending Jobs
   └─ Same as Flow 1

3. Admin Rejects Payment
   └─ PUT /api/sync (action: "reject", reason: "...")
   └─ Updated: status=EXPIRED, payment_status=rejected, is_visible=false
   └─ Saved reason in rejection_reason field
   └─ Response: Updated job object

4. Job Removed from Pending Queue
   └─ Next GET /api/admin/pending-jobs won't return this job
   └─ Query filters out status != PAYMENT_PENDING

5. Job NOT Visible to Seekers
   └─ Job won't appear in search results
   └─ RLS policy filters: is_visible=true AND status=LIVE AND payment_status=approved

6. Result: JOB HIDDEN AND ARCHIVED ✓
```

---

## Database Schema Understanding

### Jobs Table Structure
```sql
jobs (
  id UUID PRIMARY KEY,
  owner_id UUID,  -- Salon owner reference
  status TEXT CHECK (status IN ('DRAFT', 'PAYMENT_PENDING', 'APPROVED', 'LIVE', 'EXPIRED', 'CLOSED')),
  payment_status TEXT CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected')),
  is_visible BOOLEAN,
  payment_screenshot_url TEXT,
  payment_amount DECIMAL,
  approved_by UUID (nullable),
  approved_at TIMESTAMP (nullable),
  rejection_reason TEXT (nullable),
  ...other fields...
)
```

### Status Lifecycle
- **PAYMENT_PENDING** → Initial state after salon owner submits
- **LIVE** → After admin approval, visible to seekers
- **EXPIRED** → After admin rejection OR job posting expires
- **CLOSED** → Job manually closed
- **DRAFT** → Not used in current flow

### RLS Policies
- **Salon Owner**: Can INSERT own jobs, SELECT own pending jobs
- **Admin**: Can SELECT all jobs, UPDATE any job status
- **Job Seeker**: Can only SELECT jobs where `status=LIVE AND is_visible=true AND payment_status=approved`

---

## API Endpoints Verified

### Job Submission
```bash
POST /api/sync
Body: {
  "type": "job-payment",
  "data": {
    "salonId": "uuid",
    "salonName": "string",
    "jobTitle": "string",
    "jobDetails": {...},
    "screenshotUrl": "url",
    "planPrice": number,
    "planName": "string"
  }
}
Response: { success: true, jobId: "uuid", data: {...full job object...} }
```

### Admin Pending Jobs
```bash
GET /api/admin/pending-jobs
Response: { 
  success: true, 
  count: number,
  data: [{...job details...}]
}
```

### Admin Approval
```bash
PUT /api/sync
Body: {
  "jobId": "uuid",
  "action": "approve",
  "adminId": "string"
}
Response: { success: true, job: {...updated job with status=LIVE...} }
```

### Admin Rejection
```bash
PUT /api/sync
Body: {
  "jobId": "uuid",
  "action": "reject",
  "adminId": "string",
  "reason": "string"
}
Response: { success: true, job: {...updated job with status=EXPIRED...} }
```

### Job Seeker Search
```bash
GET /api/jobs?city=Delhi&search=Stylist
Response: {
  success: true,
  data: [{...only LIVE, visible jobs...}],
  count: number
}
```

---

## Test Results - All Passing ✅

### Test 1: Complete Approval Workflow
- ✅ Salon owner creates user
- ✅ Salon owner submits job with payment proof
- ✅ Job saved with status=PAYMENT_PENDING
- ✅ Admin sees job in pending queue
- ✅ Admin approves job
- ✅ Job status updated to LIVE
- ✅ Job visible flag set to true
- ✅ Job seeker can find job in search results
- ✅ All job details preserved and visible

### Test 2: Complete Rejection Workflow
- ✅ Salon owner submits job
- ✅ Job appears in pending queue
- ✅ Admin rejects job with reason
- ✅ Job status updated to EXPIRED
- ✅ Job removed from pending queue
- ✅ Job hidden from job seekers (is_visible=false)
- ✅ Rejection reason preserved in database

### Test 3: Multiple Jobs Queue
- ✅ Multiple jobs can be in pending state simultaneously
- ✅ Admin can see all pending jobs
- ✅ Admin can approve/reject individual jobs
- ✅ Queue properly managed as jobs move through states
- ✅ No interference between jobs

### Test 4: Data Consistency
- ✅ Job data consistent across all APIs
- ✅ Real-time updates reflecting immediately
- ✅ No missing fields or corrupted data
- ✅ All status transitions valid

---

## Files Modified

1. `/vercel/share/v0-project/lib/db/jobs.ts`
   - Updated `rejectJob()` function to use `status='EXPIRED'` instead of `REJECTED`
   - Ensures compliance with database CHECK constraint

---

## Deployment Notes

### No Migration Required
- The fix uses only existing enum values in the database
- No schema changes needed
- Backwards compatible with existing data

### Data Integrity
- Rejected jobs marked with `status=EXPIRED` and `payment_status=rejected`
- Can be easily queried: `WHERE status='EXPIRED' AND payment_status='rejected'`
- Rejection reason preserved for audits

### Performance
- All queries use indexed columns: `status`, `payment_status`, `is_visible`
- RLS policies efficiently filter based on user role
- No additional database calls required

---

## Usage Examples

### For Salon Owner
```javascript
// Submit a job with payment proof
const response = await fetch('/api/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'job-payment',
    data: {
      salonId: userId,
      salonName: 'Glamour Salon',
      jobTitle: 'Senior Stylist',
      jobDetails: { description: '10+ years', skills: ['styling', 'coloring'], ... },
      screenshotUrl: 'payment-proof.jpg',
      planPrice: 1999,
      planName: 'Premium'
    }
  })
});
// Job now PAYMENT_PENDING, awaiting admin review
```

### For Admin
```javascript
// Check pending payments
const pending = await fetch('/api/admin/pending-jobs').then(r => r.json());
// Shows all PAYMENT_PENDING jobs

// Approve a job
await fetch('/api/sync', {
  method: 'PUT',
  body: JSON.stringify({
    jobId: 'job-id',
    action: 'approve',
    adminId: 'admin-id'
  })
});
// Job now LIVE, visible to seekers

// Or reject a job
await fetch('/api/sync', {
  method: 'PUT',
  body: JSON.stringify({
    jobId: 'job-id',
    action: 'reject',
    adminId: 'admin-id',
    reason: 'Invalid payment proof'
  })
});
// Job now EXPIRED, hidden from seekers
```

### For Job Seeker
```javascript
// Search for jobs
const jobs = await fetch('/api/jobs?city=Delhi&search=Stylist')
  .then(r => r.json());
// Returns only LIVE, visible, approved jobs
// Can apply for any job in results
```

---

## Conclusion

The complete salon owner → admin → job seeker workflow is **now fully functional and production-ready**. All three user flows have been tested end-to-end and are working correctly. The system correctly handles both approval and rejection cases with proper data persistence and visibility management.

**Status: ✅ READY FOR PRODUCTION DEPLOYMENT**

Last Updated: 2026-06-19  
Tested and Verified: ✅ All scenarios passing
