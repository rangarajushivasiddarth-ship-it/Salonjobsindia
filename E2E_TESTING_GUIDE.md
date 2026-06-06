# SalonJobsIndia - End-to-End Testing & Verification Guide
## Production Readiness Checklist | June 6, 2026

---

## EXECUTIVE SUMMARY

This document provides complete step-by-step verification procedures for all major workflows in the SalonJobsIndia application. All critical features have been audited, debugged, and enhanced for production use.

**Current Build Status:** ✓ PASSING (18 routes, 0 errors)
**Last Update:** June 6, 2026, 08:00 UTC
**Deployment Status:** READY FOR TESTING

---

## PART 1: AUTO-DETECT LOCATION FEATURE TESTING

### Test 1.1: Salon Owner Location Detection
**Workflow:** Auth → Role Selection → Salon Profile Setup → Auto Detect Location

**Steps:**
1. Open app and click "Register as Salon Owner"
2. Select role "Salon Owner"
3. Enter basic info (name, email, phone, password)
4. On Salon Profile Setup page, click "Auto Detect" button
5. Grant location permission when prompted
6. Verify location fields auto-fill:
   - ✓ Address field populated
   - ✓ City field populated
   - ✓ District field populated
   - ✓ State field populated
   - ✓ Country shows "India"
   - ✓ Latitude/Longitude captured

**Expected Output:**
```json
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "address": "New Delhi, India",
  "city": "New Delhi",
  "district": "Delhi",
  "state": "Delhi",
  "country": "India"
}
```

**Error Scenarios to Test:**
- [ ] Permission Denied: Should show "Location access denied. Please enable location permissions..."
- [ ] GPS Unavailable: Should show "Location information is unavailable. Please enable GPS..."
- [ ] Timeout: Should show "Location detection timed out. Please try again..."
- [ ] Manual Entry Fallback: Should allow typing location manually

---

### Test 1.2: Job Seeker Location Detection
**Workflow:** Auth → Role Selection → Resume Builder → Auto Detect Location

**Steps:**
1. Open app and click "Register as Job Seeker"
2. Select role "Job Seeker"
3. Enter basic info and navigate to location field
4. Click "Detect My Location" button
5. Grant location permission when prompted
6. Verify location displays: "Town/Area, City, State"
7. Verify can proceed with auto-detected location

**Expected Output:** Location string like "Sector 5, New Delhi, Delhi"

**Verification Points:**
- [ ] Location detected within 5-10 seconds
- [ ] Latitude/Longitude numeric values captured
- [ ] Location string is human-readable
- [ ] Location persists after page refresh (check localStorage)

---

### Test 1.3: Location Caching & Persistence
**Purpose:** Verify location data doesn't require re-detection on page reload

**Steps:**
1. Complete location detection on salon profile
2. Refresh the page (Ctrl+R or Cmd+R)
3. Verify location fields still populated
4. Open browser DevTools → Application → Local Storage
5. Search for key: `userLocation`
6. Verify JSON contains: latitude, longitude, address, city, state

**Expected Data:**
```json
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "address": "New Delhi, India",
  "city": "New Delhi",
  "district": "Delhi",
  "state": "Delhi",
  "country": "India",
  "formattedAddress": "New Delhi, Delhi, India"
}
```

---

## PART 2: REGISTRATION WORKFLOW TESTING

### Test 2.1: Salon Owner Registration - Complete Flow
**Steps:**
1. Fill registration form:
   - Name: "Test Salon Owner"
   - Email: "owner@test.com"
   - Phone: "9876543210"
   - Password: "TestPass@123"
   
2. Select "Salon Owner" role
3. Fill salon profile:
   - Salon Name: "Beauty Paradise Salon"
   - Owner Name: "Test Owner"
   - Mobile: "9876543210"
   - Click "Auto Detect" for location
   - Area: "Sector 5"
   - City: Auto-filled
   - State: Auto-filled
   
4. Click "Continue to Create Job"
5. Verify redirected to Owner Panel

**Success Criteria:**
- [ ] Registration successful (no errors)
- [ ] User created in MongoDB
- [ ] Salon profile created with all location data
- [ ] Redirected to owner panel
- [ ] Profile visible in admin dashboard

**Database Verification:**
```bash
# Check users collection
db.users.findOne({email: "owner@test.com"})

# Check salon_owners collection
db.salon_owners.findOne({userId: "USER_ID"})
```

---

### Test 2.2: Job Seeker Registration - Complete Flow
**Steps:**
1. Fill registration form:
   - Name: "Job Seeker Test"
   - Email: "seeker@test.com"
   - Phone: "9876543211"
   - Password: "TestPass@123"
   
2. Select "Job Seeker" role
3. Fill resume builder:
   - Step 1: Basic Info
     - Name: "Job Seeker Test"
     - Date of Birth: "01/01/1995"
     - Role: Select a beauty role
     - Experience: "3 years"
   
   - Step 2: Skills
     - Add skills: "Hair Cutting", "Hair Coloring"
   
   - Step 3: Location
     - Click "Auto Detect Location"
     - Verify location auto-fills
   
   - Step 4: Salary Expectation
     - Enter: "25000"
   
   - Step 5: Documents
     - Upload identity proof
     - Upload passport photo

4. Click "Submit" button
5. Verify redirected to Job Discovery

**Success Criteria:**
- [ ] Registration successful (no errors)
- [ ] User created in MongoDB
- [ ] Job seeker profile created with all data
- [ ] Skills stored as array
- [ ] Location captured with coordinates
- [ ] Documents uploaded successfully
- [ ] Redirected to job discovery

---

### Test 2.3: Registration Validation
**Test invalid inputs:**

**Invalid Phone Numbers:**
- [ ] "9876543" - Too short (should reject)
- [ ] "5876543210" - Starts with 5 (should reject)
- [ ] "98A6543210" - Contains letters (should reject)

**Invalid Email:**
- [ ] "notanemail" - Should reject
- [ ] "test@" - Missing domain (should reject)
- [ ] "test@@com" - Double @ (should reject)

**Duplicate Detection:**
- [ ] Register with email "dup@test.com"
- [ ] Try registering again with same email - Should show "User with this email or phone already exists"
- [ ] Try different email, same phone - Should also reject

---

## PART 3: ADMIN DASHBOARD SYNC TESTING

### Test 3.1: New Salon Owner Visibility
**Steps:**
1. Open admin dashboard in one browser tab
2. Open registration form in another tab
3. Complete salon owner registration in new tab
4. Switch back to admin dashboard
5. Refresh admin dashboard (manually if needed)
6. Verify new salon owner appears in "Salon Owners" table with:
   - [ ] Salon Name
   - [ ] Owner Name
   - [ ] Location (City, State)
   - [ ] Registration date
   - [ ] Status (Verified/Unverified)

---

### Test 3.2: New Job Seeker Visibility
**Steps:**
1. Keep admin dashboard open
2. Complete job seeker registration in another tab
3. Switch to admin dashboard
4. Check "Job Seekers" section
5. Verify new job seeker appears with:
   - [ ] Name
   - [ ] Role/Position
   - [ ] Location
   - [ ] Skills
   - [ ] Registration date

---

### Test 3.3: Real-Time Data Sync
**Steps:**
1. Admin dashboard open with "Salon Owners" visible
2. Complete salon owner registration
3. Observe without manual refresh (3-5 seconds wait)
4. New owner should appear

**If not appearing immediately:**
- This is acceptable - manual refresh may be needed
- Check browser console for any errors
- Verify data in MongoDB using MongoDB Compass or CLI

---

## PART 4: JOB POSTING & VISIBILITY TESTING

### Test 4.1: Job Posting Creation
**Steps:**
1. Login as salon owner
2. On Owner Panel, click "Create Job"
3. Fill job details:
   - Title: "Senior Makeup Artist"
   - Description: "Looking for experienced makeup artist"
   - Requirements: "5+ years experience"
   - Salary: "₹30,000 - ₹50,000"
   - Location: Pre-filled from salon profile
   
4. Click "Post Job"
5. Verify job appears in job list on dashboard

**Verification:**
- [ ] Job created successfully
- [ ] Job visible in job list
- [ ] Location data attached to job
- [ ] Job posting timestamp recorded

---

### Test 4.2: Job Discovery for Job Seekers
**Steps:**
1. Login as job seeker
2. Navigate to "Job Discovery" or "Search Jobs"
3. Verify jobs are displaying
4. Check that jobs near your detected location appear first
5. Click on a job to view details
6. Verify all job information displays:
   - [ ] Title
   - [ ] Description
   - [ ] Requirements
   - [ ] Salary
   - [ ] Salon location
   - [ ] Distance (if available)

---

### Test 4.3: Job Application
**Steps:**
1. As job seeker, view a job posting
2. Click "Apply" button
3. Fill application form (if applicable)
4. Submit application
5. Verify success message
6. Switch to salon owner dashboard
7. Check "Applicants" section
8. Verify new application appears with:
   - [ ] Job seeker name
   - [ ] Phone/Contact info (if unlocked)
   - [ ] Application date
   - [ ] Application status

---

## PART 5: DATA PERSISTENCE TESTING

### Test 5.1: Browser Refresh Persistence
**Steps:**
1. Complete salon owner registration
2. Press F5 or Ctrl+R to refresh page
3. Verify you're still logged in
4. Verify profile data still visible
5. Check localStorage (DevTools → Application):
   - [ ] User data present
   - [ ] Location data present
   - [ ] Session token present

---

### Test 5.2: Cross-Tab Sync
**Steps:**
1. Open app in two browser tabs
2. In Tab 1: Login and view dashboard
3. In Tab 2: Create a new job posting
4. Return to Tab 1: Verify new job appears (may need refresh)
5. In Tab 1: Edit salon profile
6. Return to Tab 2: Verify changes reflected

---

### Test 5.3: Database Persistence
**MongoDB Verification (for technical team):**

```bash
# Connect to MongoDB
mongosh "mongodb+srv://..."

# Check users collection
db.users.count()
db.users.find().limit(5)

# Check salon_owners collection
db.salon_owners.find().limit(5)

# Check job_seekers collection
db.job_seekers.find().limit(5)

# Check jobs collection
db.jobs.find().limit(5)

# Verify indexes
db.users.getIndexes()
db.jobs.getIndexes()
```

---

## PART 6: ERROR HANDLING VERIFICATION

### Test 6.1: Location Permission Denied
**Steps:**
1. Open Settings → Privacy → Location
2. Find application URL and set to "Block"
3. Try "Auto Detect Location"
4. Verify error message: "Location access denied. Please enable location permissions..."
5. Verify manual entry is still possible

---

### Test 6.2: Network Failure Handling
**Steps:**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to register
4. Verify appropriate error message
5. Re-enable network
6. Try again - should work

---

### Test 6.3: Geolocation Timeout
**Steps:**
1. Open DevTools → Settings
2. Add throttling/network delay if possible
3. Try "Auto Detect Location"
4. Should timeout after ~10 seconds
5. Verify error message: "Location detection timed out..."

---

## PART 7: SECURITY VERIFICATION

### Test 7.1: Password Security
**Steps:**
1. Attempt to register with weak password: "123"
2. Should be rejected or warned
3. Register with strong password: "SecurePass@123"
4. Attempt login with wrong password
5. Should show error (not "password incorrect" specifically)

---

### Test 7.2: Email/Phone Validation
**Steps:**
1. Try registering with invalid email: "notanemail@"
2. Should reject
3. Try registering with invalid phone: "1234567"
4. Should reject
5. Register with valid: "test@example.com" and "9876543210"
6. Should accept

---

### Test 7.3: Duplicate Prevention
**Steps:**
1. Register user with email: "dup@test.com"
2. Try registering another with same email
3. Should show: "User with this email or phone already exists"
4. Try same phone with different email
5. Should also show duplicate error

---

## PART 8: PERFORMANCE VERIFICATION

### Test 8.1: Page Load Times
**Using DevTools → Lighthouse**

Expected metrics:
- [ ] First Contentful Paint: < 2 seconds
- [ ] Largest Contentful Paint: < 3 seconds
- [ ] Cumulative Layout Shift: < 0.1

**Steps:**
1. DevTools → Lighthouse
2. Generate report for each page:
   - [ ] Homepage
   - [ ] Registration form
   - [ ] Salon profile setup
   - [ ] Job discovery
   - [ ] Admin dashboard
3. All should score > 70

---

### Test 8.2: Location Detection Speed
**Steps:**
1. Click "Auto Detect Location"
2. Measure time from click to fields populated
3. Should be < 5 seconds in good conditions

---

## PART 9: MOBILE RESPONSIVENESS

### Test 9.1: Mobile Registration
**Using Chrome DevTools → Device Emulation**

**Test Devices:**
- [ ] iPhone 12/13 (375x812)
- [ ] Pixel 5 (393x851)
- [ ] iPad (768x1024)

**Verify:**
- [ ] Forms fit without horizontal scroll
- [ ] Buttons clickable (minimum 44x44px)
- [ ] Location auto-detect works on mobile
- [ ] No overlapping elements

---

## PART 10: MULTI-BROWSER TESTING

### Supported Browsers
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)

**Per browser, verify:**
1. Location detection works
2. Registration completes
3. No console errors
4. Styling renders correctly
5. Geolocation API requests work

---

## COMPREHENSIVE CHECKLIST

### Pre-Deployment Final Checks
- [ ] All 18 routes compile successfully
- [ ] Build time < 10 seconds
- [ ] TypeScript shows 0 errors
- [ ] No console errors in production build
- [ ] Location utility working on all components
- [ ] Registration API accepting all fields
- [ ] MongoDB storing all data correctly
- [ ] Admin dashboard displays new registrations
- [ ] Job posting visible to job seekers
- [ ] Job applications trackable
- [ ] Error messages user-friendly
- [ ] Mobile responsive on key breakpoints
- [ ] Cross-browser compatibility verified
- [ ] Performance metrics acceptable
- [ ] Security validations passing

### Go/No-Go Decision
**Go to Production if:**
- ✓ All critical workflows tested and passing
- ✓ No critical bugs found
- ✓ Data persistence verified in MongoDB
- ✓ Admin dashboard receives updates
- ✓ Mobile testing passed
- ✓ Security validations passed

**No-Go if:**
- ✗ Registration not persisting to MongoDB
- ✗ Location detection failing > 10% of time
- ✗ Admin dashboard not syncing
- ✗ Critical console errors present
- ✗ Security validation failures

---

## QUICK DEBUG COMMANDS

```bash
# Check build status
npm run build

# View console logs in browser
DevTools → Console

# Check localStorage
DevTools → Application → Local Storage → (URL)

# Check MongoDB data
mongosh → db.users.find()

# Check network requests
DevTools → Network tab
```

---

## SUPPORT CONTACTS

For issues during testing:
- **Frontend Issues:** Check browser console for errors
- **Registration Issues:** Verify MongoDB connection, check network tab
- **Location Issues:** Verify location permission in browser settings
- **Admin Dashboard:** Check if sync events are firing (localStorage changes)

---

**Document Version:** 1.0
**Last Updated:** June 6, 2026, 08:00 UTC
**Status:** PRODUCTION READY - PENDING TESTING
