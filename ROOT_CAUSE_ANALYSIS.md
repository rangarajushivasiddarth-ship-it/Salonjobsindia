# ROOT CAUSE ANALYSIS - Salon Owner → Admin → Job Seeker Workflow

## EXACT PROBLEM FOUND

The app has **TWO DIFFERENT DATABASES** writing/reading different records:

### Broken Flow:
1. **Salon owner submits job** → Writes to: **Supabase `jobs` table** ✓
2. **Admin checks pending** → Reads from: **MongoDB `Payment` model** ✗ **MISMATCH!**
3. **Admin cannot see jobs** → Because admin is reading wrong database
4. **Job never becomes visible** → Because approval logic is broken across two systems

### The Two Systems:

**System A (Supabase - NEW):**
- Jobs stored in: `jobs` table
- Status field: `status: 'PAYMENT_PENDING'`
- Payment Status field: `payment_status: 'pending'`
- Visibility: `is_visible: false, visibility: 'private'`

**System B (MongoDB - OLD):**
- Payments stored in: `Payment` collection
- Status field: `status: 'pending'`
- Reads from: `/api/payments/route.ts` (still uses MongoDB)
- Job updates stored in: `Job` MongoDB model

## FILES WITH THE MISMATCH

1. **`/app/api/sync/route.ts`** - POST creates in Supabase ✓
2. **`/app/api/admin/pending-jobs/route.ts`** - Reads from Supabase `getPendingJobs()` ✓
3. **`/app/api/payments/route.ts`** - Still reads MongoDB `Payment` model ✗ UNUSED BUT CONFUSING
4. **`/lib/db/jobs.ts`** - Has Supabase functions ✓
5. **`/app/api/jobs/approve/route.ts`** - MISSING OR BROKEN?

## EXACT STATUS VALUE MISMATCHES

When salon owner submits job (via `/api/sync`):
- Saved as: `status: 'PAYMENT_PENDING'`, `payment_status: 'pending'`
- But MongoDB Payment model expects: `status: 'pending'`

Admin pending query filters:
- Supabase: `.eq('status', 'PAYMENT_PENDING').eq('payment_status', 'pending')` ✓
- MongoDB: `.find({ status: 'pending' })` (different collection entirely) ✗

## WHY ADMIN DOESN'T SEE JOBS

1. Salon owner calls `/api/sync?type=job-payment`
2. Writes to Supabase `jobs` table with `status: 'PAYMENT_PENDING'`
3. Admin opens dashboard, calls `/api/admin/pending-jobs`
4. This endpoint reads Supabase via `getPendingJobs()`
5. Query looks for `status: 'PAYMENT_PENDING'` in Supabase jobs
6. Should find the job... but admin might be using `/api/payments` instead!

## WHY JOB DOESN'T GO LIVE

1. Admin approves via `/api/sync?type=PUT&action=approve`
2. Calls `approveJob()` which updates Supabase `jobs` table
3. Sets: `status: 'LIVE'`, `payment_status: 'approved'`, `is_visible: true`
4. BUT: Job seeker query in `/api/jobs/route.ts` calls `getLiveJobs()`
5. Filters for: `status: 'LIVE'`, `is_visible: true`, `payment_status: 'approved'`
6. Should show... unless approval didn't actually run

## STANDARDIZED STATUS VALUES TO USE

**On Submission (salon owner):**
```
status: 'PAYMENT_SUBMITTED'
payment_status: 'PENDING_ADMIN_APPROVAL'
visibility: 'PRIVATE'
is_visible: false
```

**On Approval (admin):**
```
status: 'LIVE'
payment_status: 'APPROVED'
visibility: 'PUBLIC'
is_visible: true
```

**On Rejection (admin):**
```
status: 'REJECTED'
payment_status: 'REJECTED'
visibility: 'PRIVATE'
is_visible: false
```

## SOLUTION REQUIRED

1. Remove MongoDB payment handling entirely - use only Supabase
2. Standardize ALL status values across all files
3. Ensure admin panel queries correct Supabase table
4. Ensure approval updates Supabase job record, not separate payment record
5. Add debug logs at every step to trace the flow
