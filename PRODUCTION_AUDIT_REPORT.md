# Salon Jobs India - Production Readiness Audit Report

**Audit Date:** June 15, 2026  
**Application:** Salon Jobs India - Job Seeker & Salon Owner Platform  
**Database:** MongoDB  
**Framework:** Next.js 16 + React 19  
**Status:** ISSUES IDENTIFIED - Action Required Before Production

---

## Executive Summary

The Salon Jobs India application has a solid architecture with good separation of concerns between job seekers and salon owners. However, critical issues have been identified across **architecture, database integrity, security, and performance** that must be resolved before production deployment.

**Production Readiness Score: 35/100** (FAILED)

---

## CRITICAL ISSUES (Must Fix)

### 1. **Payment Status Synchronization Broken** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- Job payment status stored in TWO places: `Job.status` AND `Job.paymentStatus`
- These can get out of sync when updates fail partway
- Job can be marked `live` without corresponding `paymentStatus: 'approved'`
- Admin cannot reliably determine if job has valid payment

**Evidence:**
```typescript
// types.ts - Line 269-276
status: JobPostStatus  // Can be 'live' 
paymentStatus?: 'pending_payment' | 'approved' | 'rejected' // Can be 'pending'
// These can contradict each other!
```

**Impact:**
- Job seekers see jobs without confirmed payment
- Revenue loss - unpaid jobs appearing live
- Admin confusion about actual payment state

**Fix Required:**
- Use SINGLE source of truth for payment status
- Make all payment state changes atomic transactions
- Add validation: if `status === 'live'`, MUST have `paymentStatus === 'approved'`

---

### 2. **No Subscription Verification on Job View** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- Jobs displayed to job seekers DO filter by `status === 'live'`
- BUT they don't verify salon owner has ACTIVE subscription
- Salon owner subscription can expire while job is still marked 'live'
- Jobs from unsubscribed salon owners are visible to job seekers

**Evidence:**
```typescript
// components/customer/job-results.tsx - Line 29
if (job.isActive && job.status === 'live') {
  // Shows job, but NEVER checks if salon owner subscription is active
}
```

**Impact:**
- Job seekers browse jobs that salon owners didn't pay for
- Salon owners get free visibility after subscription expires
- Platform business model broken

**Fix Required:**
- Query salon owner subscription status when filtering jobs
- Add `expiresAt` check: only show jobs if salon subscription is active
- Add migration: deactivate jobs from expired subscriptions

---

### 3. **Missing Payment ID on Job Records** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- When job is created, `paymentId` is initially empty (line 92, jobs/route.ts)
- When payment is approved, we update job but NO guarantee payment ID is linked
- If payment is deleted, we lose link between job and payment
- Cannot audit which payment corresponds to which job

**Evidence:**
```typescript
// app/api/jobs/route.ts - Line 92
paymentId: undefined, // Not set initially!

// app/api/payments/approve/route.ts - Line 55+
// Updates job but never updates paymentId field on job
```

**Impact:**
- Cannot verify payment legitimacy for jobs
- Impossible to link jobs back to payments
- Revenue audit trail broken

**Fix Required:**
- MUST set `paymentId` when payment is approved (currently missing!)
- Add unique constraint: one payment per job
- Add validation: every live job must reference a payment

---

### 4. **No Expiration Enforcement** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- Jobs have `expiresAt` field but it's NEVER checked
- Expired jobs stay visible to job seekers indefinitely
- Salon owners get free unlimited visibility
- No cron job or background process to deactivate expired jobs

**Evidence:**
```typescript
// types.ts - Line 281
expiresAt?: Date  // Set when payment approved, but never checked!

// job-results.tsx - Line 29
if (job.isActive && job.status === 'live') {
  // Does NOT check expiresAt date!
}
```

**Impact:**
- Salon owners get unlimited free visibility after 30 days
- No mechanism to force job re-posting/payment
- Revenue model not enforced

**Fix Required:**
- Add `expiresAt` check in all job query filters
- Implement daily cron job to mark expired jobs as 'expired'
- Update job visibility filter: `expiresAt > now()`

---

### 5. **Subscription Data Structure Issues** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- User table has deprecated fields: `subscriptionType`, `shopsViewed`
- These fields reference old job seeker plans that no longer exist
- Code will crash if job seeker plan is accessed (JOB_SEEKER_PLANS = [])
- No clear link between User.isSubscribed and actual subscription in Subscriptions table

**Evidence:**
```typescript
// types.ts - Line 14-17
User {
  isSubscribed: boolean
  subscriptionType?: JobSeekerPlanType | SalonOwnerPlanType  // Ambiguous!
  subscriptionExpiry?: Date
  shopsViewed?: number  // Dead code
}

// types.ts - Line 78-81
export type JobSeekerPlanType = 'free'
export const JOB_SEEKER_PLANS: never[] = []  // Empty!
```

**Impact:**
- Subscription queries will return wrong user states
- Code written to check User.subscriptionType will crash
- Migrations will fail

**Fix Required:**
- Remove `subscriptionType` from User (single source: Subscription table)
- Remove `shopsViewed` from User (never used)
- Keep only `isSubscribed: boolean` on User for quick checks
- Add `subscriptionId` FK to User pointing to Subscriptions table

---

### 6. **Admin Payment Approval Has No Authorization** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- Admin payment approval API (payments/approve/route.ts) accepts any `adminId` string
- No verification that adminId is actually an admin
- Anyone knowing the API can approve payments by calling it directly
- No audit log of who approved what payment

**Evidence:**
```typescript
// app/api/payments/approve/route.ts - Line 9
const { paymentId, action, adminId, reason } = body
// adminId is just a string! No validation!

// No check: is this user actually an admin?
// No check: is this admin authorized to approve payments?
// No audit log created
```

**Impact:**
- Security breach: anyone can approve payments
- Fraud: malicious actors can make jobs live without payment
- No compliance trail for audits

**Fix Required:**
- Add authentication: verify request is from logged-in user
- Add authorization: verify user has `admin` role
- Add audit log: log all approvals with timestamp, user, reason
- Consider adding supervisor approval for amounts over threshold

---

### 7. **Missing Database Indices** 🔴
**Severity:** CRITICAL | **Status:** Active Issue

**Problem:**
- No indices defined on frequently-queried fields
- Queries like `status === 'live'` scan entire jobs collection
- Queries by `salonId` or `userId` scan entire collections
- Performance degrades with scale (100K+ records)

**Evidence:**
```typescript
// app/api/jobs/route.ts - Line 40
collection.find(query).skip(...).limit(...).toArray()
// No indices! Full collection scan on every request

// No sorting/filtering on indexes
```

**Impact:**
- Database queries become slow (100ms → 5s+ as data grows)
- Application becomes unusable at scale
- High database CPU costs

**Fix Required:**
- Add index on `jobs.status` (frequently filtered)
- Add index on `jobs.salonId` (ownership queries)
- Add index on `jobs.expiresAt` (expiration queries)
- Add index on `jobs.createdAt` (sorting by newest)
- Add index on `payments.userId` (user payment history)
- Add index on `resumes.userId` (job seeker profile)
- Add compound indices for common query patterns

---

## HIGH PRIORITY ISSUES (Should Fix Before Launch)

### 8. **Job Filtering Missing Salon Owner Check**
**Severity:** HIGH | **Status:** Active Issue

**Problem:**
- Job visibility doesn't verify salon owner exists and is active
- Deleted salon owners' jobs still visible
- Orphaned jobs with invalid salonId shown to users

**Fix:**
- Add `JOIN` with salon_profiles table
- Filter out jobs from deleted/banned salons
- Add validation when creating jobs: salon must exist

---

### 9. **No Rate Limiting on Payment API**
**Severity:** HIGH | **Status:** Active Issue

**Problem:**
- Payment approval endpoint has no rate limiting
- Attacker could spam payment approvals
- No DDoS protection

**Fix:**
- Add rate limiter: max 10 payments/second per admin
- Add IP-based rate limiting for POST requests
- Use middleware like `next-rate-limit`

---

### 10. **Missing Input Validation**
**Severity:** HIGH | **Status:** Active Issue

**Problem:**
- Job creation doesn't validate all required fields
- No validation on salary ranges, location coordinates
- No SQL injection prevention (though using MongoDB parameters)
- XSS risk: job descriptions not sanitized

**Fix:**
- Add Zod/Yup validation schema for all inputs
- Sanitize HTML in job descriptions
- Validate coordinates are within India
- Add max length limits on text fields

---

### 11. **No Transaction Rollback on Failure**
**Severity:** HIGH | **Status:** Active Issue

**Problem:**
- Payment approval updates both payments and jobs collections
- If second update fails, first is not rolled back
- Job could be marked 'live' but payment not marked 'approved'

**Evidence:**
```typescript
// app/api/payments/approve/route.ts - Line 42+
await paymentsCollection.updateOne(...)  // Succeeds
await jobsCollection.updateOne(...)      // Fails - payment update not rolled back!
```

**Fix:**
- Use MongoDB transactions for multi-document updates
- Wrap in try-catch with rollback on failure
- Use session.withTransaction() for atomic operations

---

### 12. **Orphaned Payment Records Possible**
**Severity:** HIGH | **Status:** Active Issue

**Problem:**
- If job is deleted, its payment record stays orphaned
- If salon owner is deleted, their payments/subscriptions orphaned
- No referential integrity (no foreign keys)

**Fix:**
- Add cascade delete: deleting job also deletes its payment
- Add cascade delete: deleting salon owner also deletes subscriptions
- Add data cleanup job to find orphaned records

---

## MEDIUM PRIORITY ISSUES (Should Fix Before Production)

### 13. **No Error Recovery Mechanism**
**Severity:** MEDIUM

**Problem:**
- No retry logic on failed operations
- Job creation fails? No way to retry automatically
- Payment approval fails? Admin must manually re-try

**Fix:**
- Add exponential backoff retry for MongoDB operations
- Add dead letter queue for failed processes
- Add admin UI to retry failed operations

---

### 14. **Geolocation Not Validated**
**Severity:** MEDIUM

**Problem:**
- Job locations not validated to be within India
- Could create jobs with invalid coordinates
- No bounds checking

**Fix:**
- Validate latitude -8 to 35, longitude 68 to 97
- Add Google Maps API validation
- Snap invalid locations to nearest city

---

### 15. **No Duplicate Job Prevention**
**Severity:** MEDIUM

**Problem:**
- Salon owner could create identical job multiple times
- Spam prevention not implemented
- No cooldown between job postings

**Fix:**
- Add unique constraint on (salonId, role, createdDate)
- Add cooldown: max 3 jobs per salon per day
- Warn if job matches previously rejected job

---

### 16. **Admin Panel Security Not Verified**
**Severity:** MEDIUM

**Problem:**
- No verification that admin panel is protected
- Could have public admin routes
- No role-based access control verified

**Fix:**
- Verify all admin routes require authentication
- Add role check middleware on all admin endpoints
- Implement audit logging for all admin actions

---

## LOW PRIORITY ISSUES (Nice to Have)

### 17. **Performance Optimization Opportunities**
- Add caching layer (Redis) for job listings
- Add pagination cursor-based instead of offset-based
- Add database connection pooling
- Implement query result caching

### 18. **Monitoring & Observability**
- Add error tracking (Sentry)
- Add database performance monitoring
- Add API response time tracking
- Add user analytics

---

## PRODUCTION READINESS CHECKLIST

| Category | Status | Notes |
|----------|--------|-------|
| Architecture | ⚠️ PARTIAL | Clear structure but data integrity issues |
| Database Schema | 🔴 FAILED | Redundant fields, missing indices, no constraints |
| Payment Workflow | 🔴 FAILED | Critical sync issues, missing audit trail |
| Security | 🔴 FAILED | No auth verification, no rate limiting, no input validation |
| Error Handling | 🔴 FAILED | No transactions, no rollback mechanism |
| Data Consistency | 🔴 FAILED | Orphaned records possible, no cascade deletes |
| Performance | 🔴 FAILED | No indices, will degrade at scale |
| Testing | ❌ UNKNOWN | No test coverage mentioned |
| Monitoring | ❌ MISSING | No error tracking or observability |
| Documentation | ⚠️ PARTIAL | Types defined but workflows undocumented |

---

## RECOMMENDED ACTION PLAN

### **Phase 1: Critical Fixes (Days 1-3)**
1. Fix payment status synchronization (single source of truth)
2. Add subscription verification to job queries
3. Fix missing paymentId linking on job approval
4. Add expiresAt checking to all job filters
5. Remove deprecated User fields (subscriptionType, shopsViewed)

### **Phase 2: Security Hardening (Days 4-5)**
1. Add admin auth verification to payment endpoints
2. Add rate limiting to APIs
3. Add input validation and sanitization
4. Add audit logging to admin actions
5. Implement transaction rollbacks

### **Phase 3: Data Integrity (Days 6-7)**
1. Add database indices
2. Add referential integrity constraints
3. Create data cleanup jobs
4. Add orphaned record detection
5. Add cascade delete implementation

### **Phase 4: Testing & Verification (Days 8-10)**
1. Load test with 100K jobs, 50K users
2. Verify payment workflows end-to-end
3. Test failure scenarios and recovery
4. Verify admin audit trails
5. Run security penetration test

---

## CONCLUSION

The application has a **good foundation** but **critical issues must be fixed before any production deployment**. The primary concerns are:

1. **Data Integrity**: Payment status can be out of sync
2. **Revenue Protection**: Expired jobs stay visible
3. **Security**: Admin endpoints have no authorization
4. **Performance**: No database indices for queries
5. **Reliability**: No transaction support or rollback

**Estimated Fix Time:** 5-7 days with a focused team  
**Estimated Testing Time:** 3 days  
**Total Time to Production:** 2 weeks

Do not deploy to production until these critical issues are resolved.

---

**Report Generated:** June 15, 2026  
**Next Review:** After fixes implemented
