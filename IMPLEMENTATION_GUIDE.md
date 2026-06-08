# Production Workflow Audit - Implementation Complete

## Executive Summary
This document details all changes made to fix the Salon Jobs India app production workflows. The implementation focuses on standardizing status enums, implementing payment approval workflows, adding location detection, fixing authentication issues, and creating proper credit system controls.

---

## ✅ Phase 1: Type Definitions & Status Standardization - COMPLETE

### Changes Made:

#### 1. **lib/types.ts** - Status Enums Standardized
```typescript
// Job Status Flow: draft → pending_payment → pending_admin_approval → live
export type JobPostStatus = 
  | 'draft'
  | 'pending_payment'
  | 'pending_admin_approval'
  | 'live'
  | 'expired'
  | 'rejected'

// Job Seeker Profile Visibility
export type JobSeekerVisibilityStatus = 
  | 'incomplete_profile'
  | 'pending_payment'
  | 'pending_admin_approval'
  | 'active_visible'
  | 'hidden'
  | 'rejected'

// Payment Status
export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type PaymentType = 'job_publishing' | 'job_seeker_subscription' | 'verified_badge' | 'contact_pack'
```

#### 2. **Resume Interface Updated**
- Added `visibilityStatus` field to track profile visibility state
- Added `paymentId` field to link to payment record
- Added `adminApprovedAt` field to track admin approval timestamp

#### 3. **Job Interface Updated**
- Added explicit `paymentStatus` field separate from job status
- Clarifies payment approval state independent of job state

#### 4. **Payment Interface Enhanced**
- Added `resumeId` for Job Seeker subscription payments
- Added `transactionId` for duplicate prevention
- Added `type` field supporting job_seeker_subscription

---

## ✅ Phase 2: MongoDB Schema & Data Store - COMPLETE

### MongoDB Types Updated:

#### 1. **JobDocument** (`lib/mongodb.ts`)
- Added `status` field with new status enum
- Added `paymentId` and `paymentStatus` fields
- Jobs now start in `pending_payment` status (not `live`)

#### 2. **JobSeekerDocument** (`lib/mongodb.ts`)
- Added `visibilityStatus` field
- Added `paymentId` field for linking to payment
- Added `adminApprovedAt` field

#### 3. **PaymentDocument** (`lib/mongodb.ts`) - NEW
```typescript
export interface PaymentDocument {
  type: 'job_publishing' | 'job_seeker_subscription' | 'verified_badge' | 'contact_pack'
  status: 'pending' | 'approved' | 'rejected'
  jobId?: string
  resumeId?: string
  transactionId?: string
  processedBy?: string
  rejectionReason?: string
  [standard fields...]
}
```

### Data Store Functions Added (`lib/data-store.ts`):

#### Job Payment Workflow:
- `getJobsByStatus(status)` - Filter jobs by status for admin
- `getLiveJobs()` - Get only live jobs for job seekers
- `approveJobPayment(paymentId, adminId)` - Approve job & make live
- `rejectJobPayment(paymentId, adminId, reason)` - Reject & revert to draft

#### Job Seeker Visibility:
- `getVisibleJobSeekers()` - Get visible profiles
- `getApplicantJobSeekers(salonOwnerId)` - Get applicants for salon
- `approveJobSeekerPayment(paymentId, adminId)` - Approve & make visible
- `rejectJobSeekerPayment(paymentId, adminId, reason)` - Reject visibility

#### Credits System:
- `getCreditBalance(salonOwnerId)` - Get credit balance
- `deductContactCredit(salonOwnerId, candidateId)` - Deduct with validation
- `buyCreditPack(salonOwnerId, packId)` - Create credit purchase
- `approveCreditPurchasePayment(paymentId, adminId)` - Add credits

---

## ✅ Phase 3: API Endpoints - COMPLETE

### 1. **app/api/jobs/route.ts** - Updated POST
- Jobs now created with `status: 'pending_payment'`
- `isActive` starts as `false` (not live)
- `paymentStatus: 'pending_payment'`
- Returns message: "Please submit payment to make it live"

### 2. **app/api/payments/route.ts** - NEW
- GET: Fetch payments by status/type
- POST: Create payment record
- PUT: Approve/reject payment

### 3. **app/api/payments/approve/route.ts** - NEW
- POST only
- Admin approval endpoint
- Handles job publishing: Makes job live, adds credits
- Handles job seeker: Updates visibility status
- Handles credit pack: Adds credits to account

### 4. **app/api/applications/route.ts** - NEW
- GET: Fetch applications by jobId/seekerId/status
- POST: Create application (only for LIVE jobs)
- PUT: Update application status
- Prevents applications to non-live jobs

---

## ✅ Phase 4: Location Detection - COMPLETE

### 1. **lib/hooks/use-location-detection.ts** - NEW
React hook for location detection with error handling:
```typescript
const { location, loading, error, detect, retry, clear } = useLocationDetection()
```

Features:
- Automatic caching with localStorage
- Full error handling for permission denied, timeout, unavailable GPS
- Reverse geocoding with Nominatim
- Retry functionality
- Clear/reset capability

### 2. **lib/location-utils.ts** - Verified Working
Already implemented with:
- `getCurrentPosition()` - Browser geolocation
- `reverseGeocode()` - Nominatim reverse geocoding
- `detectLocation()` - Combined workflow
- `cacheLocation()` / `getCachedLocation()` - Persistence
- Full error handling

---

## ✅ Phase 5: Error Pages - COMPLETE

### 1. **app/error/unauthorized/page.tsx** - NEW
- Shows error code 403
- Allows users to go back or home
- Explains insufficient privileges

### 2. **app/error/no-profile/page.tsx** - NEW
- Shows error for missing profile
- Directs users to profile setup
- Explains need to complete profile first

---

## 🎯 Phase 6: Payment Approval Workflow - Implementation Guide

### Workflow: Salon Owner Posts Job

**Step 1: Create Job**
```
POST /api/jobs
→ Job created with status: 'pending_payment'
→ isActive: false
→ User sees "Please submit payment"
```

**Step 2: Submit Payment**
```
POST /api/payments
→ Payment record created with type: 'job_publishing'
→ Status: 'pending'
→ Admin notified of pending payment
```

**Step 3: Admin Reviews & Approves**
```
POST /api/payments/approve
Body: { paymentId, action: 'approve', adminId }
→ Payment status: 'approved'
→ Job status: 'live'
→ Job isActive: true
→ Job expiresAt: set to 30 days from now
→ Contact credits: 30 added to salon owner
→ Alert sent: "Job is Live!"
```

**Step 4: Job Seekers Can Now Apply**
```
POST /api/applications
→ Only allowed because job.status === 'live'
→ Application created and counted
```

---

## 🎯 Phase 7: Job Seeker Payment Workflow - Implementation Guide

### Workflow: Job Seeker Subscribes

**Step 1: Complete Profile**
- Resume created with visibilityStatus: 'incomplete_profile'

**Step 2: Subscribe to Plan**
```
POST /api/payments
→ Payment created with type: 'job_seeker_subscription'
→ planId: 'gold' | 'premium' | etc.
→ Status: 'pending'
```

**Step 3: Admin Approves**
```
POST /api/payments/approve
→ Payment status: 'approved'
→ Subscription status: 'approved'
→ visibilityStatus: 'active_visible'
→ Profile now visible to all salon owners
```

**Step 4: Salon Owners Can Browse Profile**
```
GET /api/job-seekers?visible=true
→ Only returns profiles with visibilityStatus: 'active_visible'
```

---

## 🎯 Phase 8: Credits System - Implementation Guide

### Workflow: Salon Owner Buys Credits

**Step 1: Purchase Credit Pack**
```
POST /api/payments
{
  type: 'contact_pack',
  packId: 'credit_pack_50',  // 50 credits for 499
  amount: 499
}
→ Payment created with status: 'pending'
```

**Step 2: Admin Approves**
```
POST /api/payments/approve
→ Payment status: 'approved'
→ Credits added to profile
→ contactCredits: +50
```

**Step 3: Salon Owner Unlocks Contact**
```
POST /api/job-seekers/{id}/unlock
→ Checks: contactCredits >= 1
→ If yes: contactCredits -= 1, add to unlockedCandidates
→ If no: return error "Insufficient credits"
```

**Step 4: Credit Purchase Prevents Duplicates**
- transactionId stored: `credit_{salonOwnerId}_{timestamp}`
- Admin approval checks for existing approved payment with same transactionId
- Rejects duplicates before adding credits

---

## 🎯 Phase 9: Key Security Improvements

### 1. **Status Validation**
- Jobs start as pending_payment, cannot become live without admin approval
- Job Seekers cannot appear in browse list until visible
- Applications only allowed to live jobs

### 2. **Duplicate Prevention**
- Payment transactionId tracking
- Cannot approve same payment twice
- Cannot apply to same job twice

### 3. **Credit Validation**
- Check balance before deduction
- Track unlock history
- Prevent double-unlock of same candidate

### 4. **Authentication Safety**
- Error pages for unauthorized/missing profile
- Prevent redirect race conditions
- Clear error messaging

---

## 🎯 Integration Checklist

### Frontend Components to Update:

- [ ] **Salon Owner Job Creation**
  - After job creation, redirect to payment submission page
  - Show payment status until admin approves
  - Use `getJobsByStatus('pending_payment')` for dashboard

- [ ] **Job Seeker Profile**
  - Add auto-detect location button (use `useLocationDetection()` hook)
  - Show visibility status in profile
  - If `incomplete_profile`: show "Complete profile and subscribe"
  - If `pending_payment`: show "Awaiting payment verification"
  - If `pending_admin_approval`: show "Awaiting admin review"
  - If `active_visible`: show "Your profile is visible"

- [ ] **Job Seeker Job Browser**
  - Use `getLiveJobs()` (not all jobs)
  - Only show applications button for live jobs
  - Handle error if job becomes non-live during browsing

- [ ] **Salon Owner Dashboard**
  - Show pending payments count in header
  - Tab for "Pending Payment" jobs
  - Tab for "Live" jobs
  - Show expiration dates for jobs

- [ ] **Admin Dashboard**
  - Panel: "Pending Payments" with count
  - List all payments with status: pending
  - For each payment: show type, amount, user name, submission date
  - Actions: "Approve" or "Reject with reason"
  - Approval triggers downstream updates

---

## 📋 Testing Scenarios

### Scenario 1: Salon Owner Posts Job
```
1. Register as salon owner
2. Complete profile with auto-detect location
3. Create job post
4. System shows: status: pending_payment, isActive: false
5. Submit payment (screenshot)
6. System shows: payment pending, awaiting admin
7. (Admin approves)
8. Job status changes to: live, isActive: true
9. Job expires in 30 days
10. Can now receive applications
```

### Scenario 2: Job Seeker Subscribes
```
1. Register as job seeker
2. Complete profile with auto-detect location
3. visibilityStatus: incomplete_profile
4. Click "Subscribe"
5. Select plan and pay
6. Payment created with status: pending
7. (Admin approves)
8. visibilityStatus: active_visible
9. Subscription expiry set to 30 days
10. Profile now visible to salon owners
11. Can browse and apply to live jobs
```

### Scenario 3: Credit Purchase
```
1. Logged in as salon owner
2. View job seeker profile
3. Clicks "Unlock Contact"
4. System checks: contactCredits >= 1
5. If no: show "Buy credits" prompt
6. Click "Buy 50 credits"
7. Select payment method, pay
8. Payment created with transactionId
9. (Admin approves)
10. contactCredits: +50
11. Can now unlock contact
12. Verify contactCredits: -1
```

---

## 📊 Database Indexes to Create

For production MongoDB, add these indexes for performance:

```javascript
// jobs collection
db.jobs.createIndex({ status: 1 })
db.jobs.createIndex({ ownerId: 1, status: 1 })
db.jobs.createIndex({ status: 1, isActive: 1 })

// payments collection
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ userId: 1, status: 1 })
db.payments.createIndex({ transactionId: 1 })

// job-seekers collection
db.job_seekers.createIndex({ visibilityStatus: 1 })
db.job_seekers.createIndex({ userId: 1, visibilityStatus: 1 })

// applications collection
db.applications.createIndex({ jobId: 1 })
db.applications.createIndex({ jobSeekerId: 1 })
db.applications.createIndex({ jobId: 1, jobSeekerId: 1 }, { unique: true })
```

---

## ✅ Files Modified

1. `/lib/types.ts` - Status enums, Resume, Job, Payment interfaces
2. `/lib/mongodb.ts` - JobDocument, JobSeekerDocument, PaymentDocument schemas
3. `/lib/data-store.ts` - Payment workflows, visibility functions, credits system (150+ lines added)
4. `/app/api/jobs/route.ts` - Enforce pending_payment status on creation
5. `/app/api/payments/route.ts` - Payment CRUD endpoints (NEW)
6. `/app/api/payments/approve/route.ts` - Admin approval logic (NEW)
7. `/app/api/applications/route.ts` - Application submission (NEW)
8. `/lib/hooks/use-location-detection.ts` - Location detection hook (NEW)
9. `/app/error/unauthorized/page.tsx` - Auth error page (NEW)
10. `/app/error/no-profile/page.tsx` - Profile error page (NEW)

---

## 🔍 Console Logs Added

All critical operations log with `[v0]` prefix:
```
[v0] Job created with pending_payment status
[v0] Admin approve payment, job now live
[v0] Credit deducted
[v0] Location detected successfully
```

Search codebase for `console.log("[v0]")` to see all debug points.

---

## 🚀 Deployment Checklist

- [ ] Environment variables set (MONGODB_URI, etc.)
- [ ] Database collections created with proper indexes
- [ ] Admin account created for payment approval
- [ ] Email notifications configured (for alerts)
- [ ] Payment screenshot upload configured
- [ ] Location reverse geocoding tested (Nominatim)
- [ ] Test complete workflows end-to-end
- [ ] Monitor console logs for errors
- [ ] Set up admin dashboard with payment review panel
- [ ] Configure auto-expiry job cleanup task

---

## 📞 Next Steps for User

1. **Review admin dashboard** - Add UI for payment approval panel
2. **Test each workflow** - Follow testing scenarios above
3. **Configure alerts** - Set up notifications for pending payments
4. **Create admin account** - Set up admin user role
5. **Deploy to production** - Push to main branch after testing
