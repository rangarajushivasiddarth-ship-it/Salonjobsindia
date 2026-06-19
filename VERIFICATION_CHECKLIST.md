# SALON OWNER → ADMIN → SEEKER SYNC VERIFICATION CHECKLIST

## PROOF REQUIRED (As per user's mandate)

Use these exact tests to verify the end-to-end workflow works with REAL database records:

### TEST 1: SALON OWNER SUBMIT

```
1. Login as Salon Owner
2. Click "Create Job"
3. Fill form:
   - Salon Name: "Test Salon ABC"
   - Job Title: "Hair Stylist"
   - Location: Select city
   - Upload payment screenshot
   - Click "Submit for Payment"

4. CHECK LOGS for:
   [Realtime Sync] Submitting job payment:
   [v0] [Sync API] Creating job with status=PAYMENT_PENDING, paymentStatus=pending
   [Sync API] Job payment submitted: {paymentId} for job: {jobId}

5. NOTE DOWN: jobId from logs
```

### TEST 2: ADMIN SEES PAYMENT PENDING

```
1. Login as Admin
2. Go to "Payment Approvals" page
3. Should see job from TEST 1 in pending list:
   - Salon Name: "Test Salon ABC"
   - Job Title: "Hair Stylist"
   - Screenshot visible
   - Payment amount shown

4. CHECK LOGS for:
   [v0] [Admin Pending] Querying jobs with status=PAYMENT_PENDING, paymentStatus=pending
   [v0] [Admin Pending] Found 1 jobs

5. If NO jobs show:
   - Check logs for "Found 0 jobs" → database connection issue
   - Check MongoDB directly:
     db.jobs.find({status:'PAYMENT_PENDING', paymentStatus:'pending'})
   - Should return the job from TEST 1
```

### TEST 3: ADMIN APPROVES JOB

```
1. Admin clicks "Approve" on pending job
2. Confirm action in modal
3. Should see success message

4. CHECK LOGS for:
   [v0] Job status before approval: PAYMENT_PENDING, paymentStatus: pending
   [v0] Approving job {jobId} - updating status PAYMENT_PENDING → LIVE
   [v0] Job updated, new status: LIVE, paymentStatus: approved
   [v0] Job approved and made live: {jobId}

5. Check MongoDB directly:
   db.jobs.findById({jobId})
   Should show:
   {
     _id: ObjectId(jobId),
     status: "LIVE",
     paymentStatus: "approved",
     isVisible: true,
     visibility: "public",
     isLive: true,
     approvedAt: ISODate(...),
     approvedBy: ObjectId(adminId)
   }

6. If NOT updated:
   - Check admin permission to update jobs
   - Check Mongoose session transactions
   - Check MongoDB transaction support (requires replicaset)
```

### TEST 4: JOB SEEKER SEES LIVE JOB

```
1. Logout Admin
2. Login as Job Seeker
3. Go to "Browse Jobs" / "Search Jobs"
4. Should see job from TEST 1:
   - Job Title: "Hair Stylist"
   - Salon Name: "Test Salon ABC"
   - Location: Same city
   - Can click and apply

5. CHECK LOGS for:
   [v0] [Job Seeker] Query filters: {"status":"LIVE","isVisible":true,"paymentStatus":"approved"}
   [v0] [Job Seeker] Total matching jobs: 1

6. If NO jobs show:
   - Check logs for query filters → which filter is wrong
   - Check MongoDB directly:
     db.jobs.find({status:'LIVE', isVisible:true, paymentStatus:'approved'})
   - Should return the job
```

### TEST 5: ADMIN REJECTS JOB

```
1. Salon owner submits another job
2. Admin sees it pending
3. Click "Reject" instead of "Approve"
4. Add rejection reason
5. Submit

CHECK LOGS:
   [v0] Job status before approval: PAYMENT_PENDING
   [v0] Job payment rejected: {jobId}

CHECK MONGODB:
   db.jobs.findById({jobId})
   Should show:
   {
     status: "DRAFT",
     paymentStatus: "rejected",
     isVisible: false,
     visibility: "private",
     rejectionReason: "..."
   }
```

## ENVIRONMENT VERIFICATION

Before running tests, verify:

```bash
# Check MongoDB URL
echo $MONGODB_URI

# Check it's same for all apps
# Admin app should use same MONGODB_URI
# Salon owner app should use same MONGODB_URI
# Job seeker app should use same MONGODB_URI

# Check connection by running:
# (If you have access to server terminal)
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
  process.exit(0);
}).catch(err => {
  console.log('❌ Connection failed:', err.message);
  process.exit(1);
});
"
```

## DATABASE VERIFICATION

Check that the jobs collection has all required fields:

```bash
# Connect to MongoDB and run:
db.jobs.findOne({status: 'PAYMENT_PENDING'})

# Should return document with fields:
{
  _id: ObjectId,
  ownerId: ObjectId,           # ✅ Salon owner ID
  title: "Hair Stylist",       # ✅ Job title
  salonName: "Test Salon ABC", # ✅ Salon name
  status: "PAYMENT_PENDING",   # ✅ Status
  paymentStatus: "pending",    # ✅ Payment status
  paymentScreenshotUrl: "...", # ✅ Screenshot URL
  paymentAmount: 499,          # ✅ Amount
  paymentPlan: "Job Posting",  # ✅ Plan
  paymentSubmittedAt: ISODate,
  visibility: "private",
  isLive: false,
  isVisible: false,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## REAL-TIME SYNC VERIFICATION

After admin approves:

```
1. Salon owner still on job detail page
2. Should see status change to "Live" within 2-3 seconds
3. Without manual refresh

If NOT updating in real-time:
   - useAdminSync hook polling every 2 seconds
   - Check admin component useEffect dependencies
   - Check browser console for fetch errors
   - Check network tab in DevTools
```

## LOGS TO COLLECT

When running test, collect these logs:

```
1. Browser Console (Ctrl+Shift+J):
   - All [v0] and [Realtime Sync] logs
   - Screenshot console output

2. Server Logs (if accessible):
   - /api/sync POST logs
   - /api/admin/pending-jobs GET logs
   - /api/jobs/approve POST logs
   - /api/jobs GET logs

3. Database State (MongoDB):
   - jobs collection document before and after each step
   - Check _id, status, paymentStatus, isVisible values
```

## SUCCESS CRITERIA

Test passes if:

```
✅ Salon owner can submit job with payment screenshot
✅ Admin sees pending payment approval within 2 seconds
✅ Admin can click "Approve" button
✅ Job status changes to LIVE immediately (see logs)
✅ Job seeker can see live job in search within 3 seconds
✅ Job seeker can apply to job
✅ Admin can reject job (test with different job)
✅ Rejected job disappears from seeker view
```

## FAILURE DEBUGGING

If test fails at any step:

### Admin doesn't see pending jobs:
```
Possible causes:
1. Salon owner submit didn't save to DB
   → Check: [v0] [Sync API] Creating job logs
   → MongoDB: db.jobs.countDocuments({status:'PAYMENT_PENDING'})
   
2. Admin query doesn't match saved data
   → Check: [v0] [Admin Pending] Querying jobs logs
   → MongoDB: db.jobs.find({status:'PAYMENT_PENDING', paymentStatus:'pending'})
   
3. Admin doesn't have read permission
   → Check: MongoDB access rules
   → Verify: Admin user has role=admin in database
```

### Admin approves but job doesn't go live:
```
Possible causes:
1. Approval update failed
   → Check: [v0] Job updated logs
   → MongoDB: db.jobs.findById({jobId}).status should be LIVE
   
2. Transaction failed (needs replicaset)
   → Check: MongoDB transaction logs
   → Solution: Enable MongoDB replicaset
   
3. Mongoose session error
   → Check: Browser console for API error response
   → Check: /api/jobs/approve response body
```

### Job seeker doesn't see live jobs:
```
Possible causes:
1. Admin approval didn't update isVisible
   → Check: MongoDB: db.jobs.findById({jobId}).isVisible should be true
   
2. Job seeker query filter is wrong
   → Check: [v0] [Job Seeker] Query filters logs
   → Should show: status='LIVE', isVisible=true, paymentStatus='approved'
   
3. Job seeker doesn't have read permission
   → Check: MongoDB access rules for job seeker role
```

## END-TO-END TEST SCRIPT

Use this sequence to test complete flow:

```
TIME: Step 1 - Salon owner submits
       Check: [v0] [Sync API] Creating job
       Check: MongoDB has job with status=PAYMENT_PENDING

T+2s: Step 2 - Admin page loads
       Check: [v0] [Admin Pending] Found X jobs (should be ≥1)
       
T+3s: Step 3 - Admin clicks approve
       Check: [v0] Job approved and made live
       Check: MongoDB has job with status=LIVE
       
T+5s: Step 4 - Job seeker refreshes search
       Check: [v0] [Job Seeker] Total matching jobs (should be ≥1)
       Check: Job appears in job seeker search results

TOTAL TIME: ~5 seconds from submit to seeker visibility
```

## FINAL SIGN-OFF

Only mark as "Working" when you can provide:

1. Screenshots of all 4 steps (submit, admin pending, approve, seeker sees)
2. Browser console logs showing [v0] debug output at each step
3. MongoDB document dumps showing status changes
4. Timestamps showing <5 second delay from approval to seeker visibility

This is the proof required to confirm the bug is fixed and ready for production.
