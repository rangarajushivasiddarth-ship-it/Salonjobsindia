# IDENTIFY YOUR SPECIFIC ERROR - Choose One

When you test the workflow, you will see ONE of these errors. Tell me which one:

---

## ❌ ERROR A: "Salon owner submits payment but nothing happens"
**What you see:**
- You fill the form, upload screenshot, click Submit
- Button is loading for a moment
- Then... nothing. No success. No error.
- Page stays on payment screen or goes blank

**Check DevTools → Console for:**
- `[Realtime Sync] Submitting job payment:` ← Should appear
- `[v0] [Sync API] Creating job in Supabase` ← Should appear
- Any red errors?

**If you see this error:** Tell me the EXACT console error message

---

## ❌ ERROR B: "Job submitted but admin doesn't see it in pending list"
**What you see:**
- Salon owner submits payment successfully
- Page shows "Pending Approval" screen
- Admin logs in successfully  
- Admin goes to Pending Payments tab
- List is EMPTY (no jobs shown)

**Check DevTools → Network for:**
- `GET /api/admin/pending-jobs` request ← Should appear
- Response Status: Should be 200 (if 401, auth token issue)
- Response data: Should have jobs in `data: [{...}, {...}]`

**If you see this error:** Tell me:
- Does the request show status 200 or 401 or 500?
- What is in the Response body?

---

## ❌ ERROR C: "Admin sees job but clicking Approve does nothing"
**What you see:**
- Admin pending list shows the submitted job
- Admin clicks Approve button
- Button seems to respond but job stays "Pending"
- No "Approved" status change

**Check DevTools → Network for:**
- `POST /api/jobs/approve` request ← Should appear
- Response Status: Should be 200
- Response body: Should have `{success: true}`

**If you see this error:** Tell me:
- Does the request show status 200 or 401 or 500?
- What is in the Response body?

---

## ❌ ERROR D: "Admin clicks Approve, gets 401 Unauthorized"
**What you see:**
- Admin sees pending job
- Clicks Approve
- Network shows POST /api/jobs/approve fails with 401
- Error message: "Unauthorized"

**This means:** Admin token not being sent or not valid

**Check DevTools → Application for:**
- Local Storage key: `salonjobsindia_admin_session`
- Should contain: `{token: 'admin_token_...', isAuthenticated: true}`

**Fix: If token is missing:**
1. Admin login didn't save token
2. Check admin-context.tsx login function
3. localStorage.setItem must be called

---

## ❌ ERROR E: "Job approved but customers don't see it"
**What you see:**
- Admin successfully approves job (status changes to Approved)
- Customer logs in and searches for jobs
- Job doesn't appear in search results
- No errors shown

**Check DevTools → Network for:**
- `GET /api/sync?type=live-jobs` request
- Response Status: Should be 200
- Response data: Should include the approved job

**Check Supabase for:**
- Job record should have:
  - status: 'LIVE'
  - payment_status: 'approved'
  - is_visible: true

**If you see this error:** Tell me:
- Is the job in Supabase with correct status values?
- Does the /api/sync response include the job?

---

## ❌ ERROR F: "Payment screenshot not showing in admin panel"
**What you see:**
- Job appears in pending list
- But screenshot preview is blank/missing
- Or screenshot URL is empty

**Check in pending job:**
- `screenshotUrl` field should contain image URL or base64
- Should NOT be empty or null

**If you see this error:** The screenshot upload didn't save properly

---

## ❌ ERROR G: "Admin can't login - 'Invalid credentials' error"
**What you see:**
- You enter credentials
- Get "Invalid email or password" error
- Even though credentials are correct

**Check:**
- Email: admin@salonjobsindia.com (case-sensitive)
- Password: admin123 (exact match)
- No extra spaces

**If still failing:** Tell me the exact email and password you're using

---

## ❌ ERROR H: "Approval seems to work but database not updating"
**What you see:**
- Admin clicks Approve
- Network shows 200 success response
- But Supabase jobs table still shows:
  - status: 'PAYMENT_PENDING' (not 'LIVE')
  - payment_status: 'pending' (not 'approved')
  - is_visible: false (not true)

**This means:** approveJob() function not actually updating database

**Check:**
- POST /api/jobs/approve response includes: `{success: true, message: 'Job approved...'}`
- But Supabase hasn't changed
- This is a database update failure

---

## TO GET HELP:

1. **Identify which ERROR (A-H) you're experiencing**
2. **Follow the "Check" instructions for that error**
3. **Tell me EXACTLY what you find**
4. **Example: "ERROR B - Request returns 401 status, response is {error: 'Unauthorized'}'"**
5. **I'll fix that specific issue**

---

## TESTING CHECKLIST

Before reporting error, manually verify these:

```
[ ] 1. Salon owner can submit a payment (watch for console messages)
[ ] 2. Job appears in Supabase jobs table with PAYMENT_PENDING status
[ ] 3. Admin can login successfully  
[ ] 4. Admin session token is in localStorage
[ ] 5. Admin navigates to Pending Payments
[ ] 6. GET /api/admin/pending-jobs shows 200 status
[ ] 7. Pending jobs list is NOT empty (shows submitted job)
[ ] 8. Admin clicks Approve
[ ] 9. POST /api/jobs/approve shows 200 status
[ ] 10. Job in Supabase now has LIVE status
[ ] 11. Customer can see job in search results
[ ] 12. Customer can apply to job
```

If any step fails, report which one and I'll fix it.

