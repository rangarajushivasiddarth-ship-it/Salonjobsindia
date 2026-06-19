# Salon Jobs India - Manual Test Checklist

## How to Use This Document

This is a comprehensive manual QA checklist for testing Salon Jobs India before deployment. 

**Setup Required:**
- Fresh Supabase database or test instance
- Test accounts created for each user type
- Test payment screenshots prepared
- Lighthouse CI configured
- Browser DevTools open for console inspection

---

## SECTION 1: USER REGISTRATION & AUTHENTICATION

### Test 1.1: Register as Job Seeker
- [ ] Open registration page
- [ ] Enter: name, email, phone, password
- [ ] Select role: "Job Seeker"
- [ ] Submit form
- [ ] **Expected:** Success message, redirected to job listings
- [ ] **Verify:** Email received with verification link
- [ ] **Check console:** No errors logged

### Test 1.2: Register as Salon Owner
- [ ] Open registration page
- [ ] Enter: name, email, phone, password, salon name
- [ ] Select role: "Salon Owner"
- [ ] Submit form
- [ ] **Expected:** Success, redirected to owner dashboard
- [ ] **Verify:** Salon profile created in database
- [ ] **Check:** No sensitive data in console logs

### Test 1.3: Validation - Email
- [ ] Try: `invalid.email`
- [ ] **Expected:** Error: "Invalid email format"
- [ ] Try: `test@` (incomplete)
- [ ] **Expected:** Error message
- [ ] Try: `test@example.com` (valid)
- [ ] **Expected:** Accepted

### Test 1.4: Validation - Phone
- [ ] Try: `123` (< 10 digits)
- [ ] **Expected:** Error: "10-digit phone required"
- [ ] Try: `9876543210` (valid)
- [ ] **Expected:** Accepted
- [ ] Try: `8876543210` (starts with 8)
- [ ] **Expected:** Error: "Must start with 6-9"

### Test 1.5: Validation - Password Strength
- [ ] Try: `123` (too weak)
- [ ] **Expected:** Error or warning about password strength
- [ ] Try: `Password123!` (strong)
- [ ] **Expected:** Accepted

### Test 1.6: Duplicate Prevention
- [ ] Register user with email: `test@example.com`
- [ ] Try to register again with same email
- [ ] **Expected:** Error: "User with this email already exists"
- [ ] Try same phone number
- [ ] **Expected:** Error: "User with this phone already exists"

### Test 1.7: Email Verification
- [ ] Register new account
- [ ] Check email inbox (wait 2-5 minutes)
- [ ] **Expected:** Verification email received
- [ ] Click verification link
- [ ] **Expected:** Verified message, can login
- [ ] Try login without email verification (test database behavior)
- [ ] **Expected:** Prompt to verify email

---

## SECTION 2: JOB POSTING (SALON OWNER WORKFLOW)

### Test 2.1: Create Draft Job
- [ ] Login as salon owner
- [ ] Navigate to "Post Job"
- [ ] Fill in:
  - [ ] Job title: "Hair Stylist"
  - [ ] Description: "Experienced stylist needed"
  - [ ] Location: "Bangalore"
  - [ ] Salary: 20,000 - 40,000 INR/month
  - [ ] Skills: select "Hair Cutting", "Coloring"
- [ ] Save as Draft
- [ ] **Expected:** Job saved, status = DRAFT
- [ ] **Verify:** Job appears in owner's draft list
- [ ] **Check:** Job NOT visible in public listings

### Test 2.2: Submit Job for Payment
- [ ] Open draft job
- [ ] Click "Submit for Review"
- [ ] Required: Payment screenshot
- [ ] Try: Submit WITHOUT screenshot
- [ ] **Expected:** Error: "Payment screenshot required"
- [ ] Upload valid screenshot (from test data)
- [ ] Submit
- [ ] **Expected:** Job status → PENDING_APPROVAL
- [ ] **Check:** Email notification sent to admin

### Test 2.3: Salary Validation
- [ ] Try: Min salary = 50,000, Max = 20,000
- [ ] **Expected:** Error: "Max must be >= Min"
- [ ] Try: Min = 20,000, Max = 20,000
- [ ] **Expected:** Accepted
- [ ] Try: Min = 20,000, Max = 40,000
- [ ] **Expected:** Accepted

### Test 2.4: Duplicate Job Detection
- [ ] Post job: "Hair Stylist in Bangalore"
- [ ] Within 24 hours, try posting identical job
- [ ] **Expected:** Error or warning: "Similar job posted recently"
- [ ] Post different job (same title, different city)
- [ ] **Expected:** Accepted

### Test 2.5: Edit Draft Job
- [ ] Create draft job
- [ ] Edit title
- [ ] Save
- [ ] **Expected:** Changes saved
- [ ] Submit draft to pending
- [ ] Try to edit pending job
- [ ] **Expected:** Cannot edit (read-only)

### Test 2.6: Delete/Close Job
- [ ] Create draft job
- [ ] Delete it
- [ ] **Expected:** Job removed from dashboard
- [ ] Create and approve a job (need admin)
- [ ] Try to delete approved job
- [ ] **Expected:** Cannot delete, option to "Close" instead
- [ ] Close active job
- [ ] **Expected:** Job hidden from listings, marked CLOSED

### Test 2.7: Job Expiry
- [ ] Create approved job
- [ ] Manually set expires_at to past date (via database/admin)
- [ ] Refresh job listing
- [ ] **Expected:** Job not shown in public listings
- [ ] Check owner dashboard
- [ ] **Expected:** Shows as "Expired"

---

## SECTION 3: PAYMENT & ADMIN APPROVAL

### Test 3.1: Payment Screenshot Upload
- [ ] As salon owner, submit payment screenshot
- [ ] **Expected:** File uploaded successfully
- [ ] **Check:** File stored securely (not accessible via direct URL)
- [ ] Try uploading non-image file (TXT, ZIP)
- [ ] **Expected:** Error: "Only image files accepted"
- [ ] Try uploading > 5MB file
- [ ] **Expected:** Error: "File too large"

### Test 3.2: Admin Dashboard - Pending Payments
- [ ] Login as admin
- [ ] Navigate to admin dashboard
- [ ] View "Pending Approvals"
- [ ] **Expected:** List shows all jobs awaiting payment approval
- [ ] Columns visible: Salon name, Job title, Amount, Screenshot
- [ ] **Check:** No pending jobs from unapproved sources

### Test 3.3: Payment Approval
- [ ] Admin views pending payment
- [ ] Click "Approve"
- [ ] **Expected:** 
  - [ ] Job status → APPROVED
  - [ ] payment_status → approved
  - [ ] is_live → true
  - [ ] Owner notified via email
  - [ ] Job visible in public listings

### Test 3.4: Payment Rejection
- [ ] Admin views pending payment
- [ ] Click "Reject"
- [ ] Enter reason: "Screenshot not clear"
- [ ] Submit
- [ ] **Expected:**
  - [ ] Job status → REJECTED
  - [ ] Owner notified with reason
  - [ ] Owner can resubmit
- [ ] Owner resubmits new screenshot
- [ ] Admin approves resubmitted screenshot
- [ ] **Expected:** Job status → APPROVED

### Test 3.5: Admin Cannot Access Without Token
- [ ] Try accessing `/admin` endpoint without authentication
- [ ] **Expected:** Redirected to login
- [ ] Try accessing `/api/admin/*` without token
- [ ] **Expected:** 401 Unauthorized
- [ ] Try with invalid token
- [ ] **Expected:** 401 Unauthorized

---

## SECTION 4: JOB LISTINGS (JOB SEEKER WORKFLOW)

### Test 4.1: Browse Live Jobs
- [ ] Login as job seeker
- [ ] Navigate to "Browse Jobs"
- [ ] **Expected:** 
  - [ ] Only APPROVED jobs shown
  - [ ] Jobs with payment_status = "approved" only
  - [ ] Jobs with is_live = true only
  - [ ] No expired jobs

### Test 4.2: Search by Location
- [ ] Enter city: "Bangalore"
- [ ] Search
- [ ] **Expected:** Results filtered to Bangalore only
- [ ] **Check:** No jobs from other cities

### Test 4.3: Search by Skills
- [ ] Select skills: "Hair Cutting", "Coloring"
- [ ] Search
- [ ] **Expected:** Results show jobs with matching skills

### Test 4.4: Search & Filter Combinations
- [ ] Filter: City = "Mumbai", Skills = "Threading"
- [ ] **Expected:** Results match BOTH filters
- [ ] Clear filters
- [ ] **Expected:** All jobs shown again

### Test 4.5: Job Details Page
- [ ] Click on a job
- [ ] **Expected:** Full details visible:
  - [ ] Salary range
  - [ ] Description
  - [ ] Required skills
  - [ ] Owner contact info (if available)
- [ ] Check: No sensitive owner info exposed

### Test 4.6: Job not Visible Before Approval
- [ ] Create job as owner (not approved yet)
- [ ] Login as different job seeker
- [ ] Search for the job
- [ ] **Expected:** Job NOT in results
- [ ] Admin approves job
- [ ] Refresh job seeker's search
- [ ] **Expected:** Job now appears

---

## SECTION 5: JOB APPLICATIONS

### Test 5.1: Submit Application
- [ ] As job seeker, view approved job
- [ ] Click "Apply"
- [ ] Enter:
  - [ ] Cover letter: "I'm interested..."
  - [ ] Resume file: Upload PDF/DOCX
- [ ] Submit
- [ ] **Expected:**
  - [ ] Application submitted successfully
  - [ ] Confirmation message
  - [ ] Application shows in "My Applications"

### Test 5.2: Upload Resume Validation
- [ ] Try uploading TXT file as resume
- [ ] **Expected:** 
  - [ ] File type validated
  - [ ] Accepted: PDF, DOCX, image formats
  - [ ] Rejected: EXE, ZIP, etc.
- [ ] Try uploading > 10MB
- [ ] **Expected:** Error: "File too large"

### Test 5.3: Prevent Duplicate Applications
- [ ] Apply to a job
- [ ] Try applying to same job again
- [ ] **Expected:** Error: "Already applied to this job"

### Test 5.4: View My Applications
- [ ] Apply to 3 different jobs
- [ ] Go to "My Applications"
- [ ] **Expected:** 
  - [ ] All 3 applications listed
  - [ ] Status shown (Pending/Accepted/Rejected/Withdrawn)
  - [ ] Job details visible

### Test 5.5: Owner Views Applications
- [ ] As salon owner, go to "My Jobs"
- [ ] Click on a job with applications
- [ ] **Expected:**
  - [ ] All applications for that job listed
  - [ ] Seeker name, phone, resume link
  - [ ] Status (Pending/Reviewed)

### Test 5.6: Owner Accepts/Rejects Application
- [ ] Click on an application
- [ ] Click "Accept"
- [ ] **Expected:**
  - [ ] Status → ACCEPTED
  - [ ] Seeker notified via email
  - [ ] Contact info shared (as configured)
- [ ] Test rejection:
  - [ ] Click "Reject"
  - [ ] Enter reason (optional)
  - [ ] **Expected:** Seeker notified with reason

### Test 5.7: Seeker Withdraws Application
- [ ] Go to "My Applications"
- [ ] Click "Withdraw"
- [ ] Confirm
- [ ] **Expected:**
  - [ ] Application status → WITHDRAWN
  - [ ] Owner notified
  - [ ] Can re-apply after withdrawal

---

## SECTION 6: AUTHENTICATION & AUTHORIZATION SECURITY

### Test 6.1: Session Timeout
- [ ] Login as user
- [ ] Wait 24 hours (or set token expiry to 5 min for testing)
- [ ] Try to access protected page
- [ ] **Expected:** Session expired, redirect to login

### Test 6.2: SQL Injection Prevention
- [ ] Search for job: `'; DROP TABLE jobs; --`
- [ ] **Expected:** Search works normally, no error
- [ ] Verify jobs table still exists
- [ ] Query: `SELECT * FROM jobs LIMIT 1`
- [ ] **Expected:** Table intact

### Test 6.3: XSS Prevention
- [ ] Create job with description: `<script>alert('XSS')</script>`
- [ ] Submit
- [ ] View job details
- [ ] **Expected:**
  - [ ] No alert pops up
  - [ ] Script tags escaped in HTML
  - [ ] Check DevTools → Elements
  - [ ] Should see: `&lt;script&gt;...&lt;/script&gt;`

### Test 6.4: CSRF Protection
- [ ] (If CSRF tokens are implemented)
- [ ] Submit form without CSRF token
- [ ] **Expected:** 403 Forbidden

### Test 6.5: File Upload Security
- [ ] Try uploading: `resume.exe`
- [ ] **Expected:** Rejected
- [ ] Try uploading: `innocent.pdf` with EXE header
- [ ] **Expected:** File type verification passes (depends on implementation)

---

## SECTION 7: DATA VISIBILITY & RLS ENFORCEMENT

### Test 7.1: User Cannot View Other's Profile
- [ ] Login as Job Seeker 1
- [ ] Try accessing Job Seeker 2's profile via URL: `/profile/seeker2-id`
- [ ] **Expected:** 403 Forbidden or no data returned
- [ ] Can view own profile
- [ ] **Expected:** Full details visible

### Test 7.2: Job Owner Cannot View Other Owner's Jobs
- [ ] Login as Salon Owner 1
- [ ] Try accessing Salon Owner 2's draft job via URL
- [ ] **Expected:** 403 Forbidden or job not found
- [ ] Can view own jobs
- [ ] **Expected:** Draft and approved jobs visible

### Test 7.3: Unauthenticated User Access
- [ ] Logout
- [ ] Try accessing `/dashboard` (protected route)
- [ ] **Expected:** Redirected to login
- [ ] Can access `/jobs` (public)
- [ ] **Expected:** Job listings visible

### Test 7.4: Admin Access Control
- [ ] Login as regular user
- [ ] Try accessing `/admin` dashboard
- [ ] **Expected:** 403 Forbidden
- [ ] Login as admin
- [ ] **Expected:** Dashboard accessible

---

## SECTION 8: NOTIFICATION & COMMUNICATION

### Test 8.1: Email Notifications - Owner
- [ ] As admin, approve job payment
- [ ] **Expected:** Owner receives email:
  - [ ] Subject: "Your Job Posted Successfully"
  - [ ] Body: Job title, live link, next steps
  - [ ] Arrival: Within 5 minutes

### Test 8.2: Email Notifications - Seeker
- [ ] As owner, accept application
- [ ] **Expected:** Seeker receives email:
  - [ ] Subject: "Application Accepted for [Job Title]"
  - [ ] Body: Owner info, next steps
  - [ ] Arrival: Within 5 minutes

### Test 8.3: Email Notifications - Admin
- [ ] As owner, submit job for approval
- [ ] **Expected:** Admin receives notification:
  - [ ] Subject: "New Job Pending Approval"
  - [ ] Body: Job details, link to approve/reject
  - [ ] Arrival: Immediate (< 1 minute)

### Test 8.4: Push Notifications (if implemented)
- [ ] Enable push notifications in settings
- [ ] As owner, receive app push when job is approved
- [ ] **Expected:** Notification appears on home screen

---

## SECTION 9: PERFORMANCE & LOAD

### Test 9.1: Page Load Times
- [ ] Open `/jobs` with 1000+ jobs in database
- [ ] **Expected:** Page loads in < 2 seconds
- [ ] Check Lighthouse Performance score
- [ ] **Expected:** > 90

### Test 9.2: Search Performance
- [ ] Search for jobs with filters
- [ ] **Expected:** Results return in < 1 second
- [ ] Open DevTools → Network
- [ ] **Check:** API response time < 500ms

### Test 9.3: Database Query Efficiency
- [ ] Admin views 100 pending jobs
- [ ] Open DevTools → Network → Timings
- [ ] **Expected:** API response < 500ms
- [ ] Check database query logs
- [ ] **Expected:** No full table scans detected

### Test 9.4: Concurrent Users
- [ ] Use load testing tool (Apache JMeter, k6)
- [ ] Simulate 100 concurrent users browsing jobs
- [ ] **Expected:**
  - [ ] No 5xx errors
  - [ ] Response time < 2000ms
  - [ ] Error rate < 1%

---

## SECTION 10: PWA & INSTALLATION

### Test 10.1: PWA Installation - Chrome/Edge
- [ ] Open app in Chrome
- [ ] Click address bar → install icon (if available)
- [ ] Install app
- [ ] **Expected:** App appears on desktop/taskbar
- [ ] Launch from desktop
- [ ] **Expected:** App loads without browser chrome

### Test 10.2: PWA Installation - Mobile
- [ ] Open app on Android Chrome
- [ ] Tap menu → "Install app"
- [ ] Confirm
- [ ] **Expected:** App icon on home screen
- [ ] Tap home screen icon
- [ ] **Expected:** App launches full-screen

### Test 10.3: Offline Functionality
- [ ] Install PWA
- [ ] View some jobs (cached)
- [ ] Disconnect from internet (airplane mode)
- [ ] Try to browse cached jobs
- [ ] **Expected:** Cached jobs visible
- [ ] Try to post new job
- [ ] **Expected:** Graceful error or queuing
- [ ] Reconnect internet
- [ ] **Expected:** Pending actions sync automatically

### Test 10.4: Lighthouse PWA Audit
- [ ] Open DevTools → Lighthouse
- [ ] Run PWA audit
- [ ] **Expected:** Score = 100 (all checks pass):
  - [ ] Installable (icon, manifest, HTTPS)
  - [ ] App Shell (service worker, offline)
  - [ ] Metadata (name, description)

---

## SECTION 11: ACCESSIBILITY

### Test 11.1: Keyboard Navigation
- [ ] Press TAB to navigate page
- [ ] **Expected:**
  - [ ] Can tab through all interactive elements
  - [ ] Focus visible (not hidden)
  - [ ] Logical tab order

### Test 11.2: Screen Reader
- [ ] Use screen reader (NVDA, JAWS on Windows; VoiceOver on Mac)
- [ ] Navigate page
- [ ] **Expected:**
  - [ ] All content readable
  - [ ] Images have alt text
  - [ ] Form labels associated

### Test 11.3: Color Contrast
- [ ] Open DevTools → Lighthouse → Accessibility
- [ ] **Expected:** All text has sufficient contrast ratio (4.5:1 min)

### Test 11.4: Mobile Accessibility
- [ ] Open on mobile (iPhone/Android)
- [ ] Try interacting with small buttons
- [ ] **Expected:** All touch targets > 44x44px

---

## SECTION 12: BROWSER & DEVICE TESTING

### Test 12.1: Desktop Browsers
- [ ] **Chrome (latest)**
  - [ ] Jobs list loads
  - [ ] Forms submit
  - [ ] PWA installable
- [ ] **Firefox (latest)**
  - [ ] Notifications visible
  - [ ] Offline works
- [ ] **Safari (latest)**
  - [ ] Apple icon visible
  - [ ] Can add to home screen
- [ ] **Edge (latest)**
  - [ ] PWA installable
  - [ ] All features work

### Test 12.2: Mobile Devices
- [ ] **iPhone (iOS 15+)**
  - [ ] App responsive
  - [ ] Can add to home screen
  - [ ] Touch interactions work
- [ ] **Android (Android 11+)**
  - [ ] Can install PWA
  - [ ] Push notifications work
  - [ ] Responsive layout

### Test 12.3: Responsive Design
- [ ] **Desktop (1920x1080)**
  - [ ] Full layout visible
  - [ ] Sidebar present
- [ ] **Tablet (768x1024)**
  - [ ] Layout adapts
  - [ ] Sidebar may collapse
- [ ] **Mobile (375x667)**
  - [ ] Mobile-optimized layout
  - [ ] All features accessible

---

## SECTION 13: DATA BACKUP & DISASTER RECOVERY

### Test 13.1: Database Backup
- [ ] Verify daily backups are created
- [ ] **Check:** Backup file exists and not corrupted
- [ ] Restore backup to test database
- [ ] **Expected:** All data intact

### Test 13.2: Image Backup
- [ ] Verify uploaded payment screenshots backed up
- [ ] Delete a screenshot from production
- [ ] Restore from backup
- [ ] **Expected:** Screenshot recovered

---

## SECTION 14: DEPLOYMENT VERIFICATION

### Test 14.1: Pre-Deployment Checklist
- [ ] All critical issues fixed
- [ ] All tests passed (manual + automated)
- [ ] Lighthouse scores > 90
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] Admin credentials secured
- [ ] HTTPS enabled
- [ ] Environment variables set correctly
- [ ] Backups configured
- [ ] Monitoring/alerting setup

### Test 14.2: Post-Deployment Verification
- [ ] Verify app accessible in production
- [ ] Test user registration works
- [ ] Test job posting flow
- [ ] Check admin dashboard
- [ ] Verify emails sending
- [ ] Monitor error logs (should be empty or non-critical)
- [ ] Check database connections stable
- [ ] Verify backups running

---

## SIGN-OFF

**Tester Name:** ________________  
**Date:** ________________  
**Overall Status:** [ ] PASS [ ] FAIL [ ] CONDITIONAL PASS  

**Issues Found:**
```
Issue 1: [Severity] [Description]
Issue 2: [Severity] [Description]
```

**Notes:**
```
[Any additional observations]
```

**Approved for Deployment:** [ ] YES [ ] NO [ ] WITH CONDITIONS

**Signature:** ________________  
**Date:** ________________

---

## REFERENCE: SEVERITY LEVELS

- **CRITICAL:** Blocks feature, security risk, or data loss
- **HIGH:** Feature broken or significantly degraded
- **MEDIUM:** Feature works but with issues
- **LOW:** Minor cosmetic or non-essential issue
