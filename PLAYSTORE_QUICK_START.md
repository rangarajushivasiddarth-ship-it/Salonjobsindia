# Google Play Store - QUICK START (5-Minute Overview)

**Status:** Your app is ready. Follow these 5 main phases.

---

## PHASE 1: Setup (30 minutes)

### 1.1 Create Google Play Console Account
- Go to: https://play.google.com/console
- Sign in with Google account
- Pay $25 one-time developer fee
- Fill in company info

### 1.2 Create New App
- Click "Create app"
- Name: **Salon Jobs India**
- Category: **Business**
- Select: **Free**
- Click Create

### 1.3 Add Legal Documents
**Settings → Setup:**
- Privacy Policy: `https://salonjobsindia.com/privacy-policy`
- Terms: `https://salonjobsindia.com/terms-and-conditions`
- Website: `https://salonjobsindia.com`
- Email: `support@salonjobsindia.com`

### 1.4 Content Rating
**Policy → Content rating:**
- Click "Fill questionnaire"
- Answer: No violence, sexual, hate speech, etc.
- Get "General Audiences" rating

---

## PHASE 2: Build App (45 minutes)

### 2.1 Install Android Studio
Download: https://developer.android.com/studio
- Full installation with SDK tools
- Takes 20-30 minutes

### 2.2 Create TWA Project
- Open Android Studio
- New Project → Empty Activity
- Package name: `com.fitonze.salonjobsindia`
- Minimum SDK: API 24

### 2.3 Configure for Web App
**File: AndroidManifest.xml**
```xml
<data
    android:scheme="https"
    android:host="salonjobsindia.com"
    android:path="/" />
```

**File: MainActivity.kt**
```kotlin
val intent = CustomTabsIntent.Builder().build()
intent.launchUrl(this, Uri.parse("https://salonjobsindia.com"))
```

### 2.4 Add App Icon
- Right-click res → Image Asset
- Upload your logo (1024x1024)
- Android Studio creates all sizes

### 2.5 Generate Signing Key
- Build → Generate Signed Bundle/APK
- Create new keystore
- Password: **SAVE THIS!**
- Validity: 10000 days
- Output: `app-release.aab`

---

## PHASE 3: Prepare Store Listing (20 minutes)

### 3.1 Add Screenshots
**Store listing → Screenshots:**
- 5-8 mobile screenshots
- Size: 1080x1920 pixels
- Show: home, jobs, messaging, profile

### 3.2 Write Description
**Short description (80 chars):**
```
Find your perfect salon career on India's leading job marketplace
```

**Full description (4,000 chars):**
```
Welcome to Salon Jobs India - the premier platform connecting salon professionals
with opportunities. Whether you're a stylist, beautician, or salon owner...

Features:
• Browse salon jobs across India
• Direct messaging with salon owners
• Post your profile and skills
• Get notified about opportunities
• Manage your salon team
```

### 3.3 Add Graphics
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG

---

## PHASE 4: Upload & Submit (10 minutes)

### 4.1 Upload Bundle
**Releases → Create new release:**
1. Click "Browse files"
2. Select `app-release.aab`
3. Click Upload
4. Wait for upload (1-2 min)

### 4.2 Review & Submit
1. Verify all info filled
2. Click "Review release"
3. Select "Roll out to 100%"
4. Click "Confirm"

---

## PHASE 5: Wait & Launch (2-24 hours)

### 5.1 Monitor Status
- Check "Release dashboard" every hour
- Status: In review → Approved
- You'll get email notification

### 5.2 Once Approved
Your app is LIVE!

**Play Store Link:**
```
https://play.google.com/store/apps/details?id=com.fitonze.salonjobsindia
```

---

## ESSENTIAL INFO

**Your Web App URL:**
- https://salonjobsindia.com

**Support Email:**
- support@salonjobsindia.com

**Package Name (Android):**
- com.fitonze.salonjobsindia

**Signing Key Location:**
- Save your `.jks` file FOREVER
- Never lose it!
- Never share it!

---

## COMMON MISTAKES TO AVOID

❌ Don't lose signing key
❌ Don't use wrong domain in manifest
❌ Don't upload wrong bundle format
❌ Don't forget privacy policy URL
❌ Don't use low-quality screenshots
❌ Don't make misleading description

---

## IF REJECTED

Check email for reason:
- **Privacy Policy:** Add URL to Play Console
- **Screenshot quality:** Use actual app screenshots
- **Misleading content:** Make description accurate
- **Policy violation:** Review app for inappropriate content

Then:
1. Fix the issue
2. Upload new bundle
3. Submit again

---

## TIMELINE

| Task | Time |
|------|------|
| Google Play Setup | 30 min |
| Build TWA App | 45 min |
| Prepare Store Listing | 20 min |
| Upload & Submit | 10 min |
| Google Review | 2-24 hrs |
| **TOTAL** | **2-4 hours** |

---

## READY? START HERE:

1. Open: https://play.google.com/console
2. Create account (pay $25)
3. Create new app
4. Download Android Studio
5. Follow PHASE 2-5 above
6. Submit!

---

**Need full details?** Read: `GOOGLE_PLAY_STORE_SUBMISSION_GUIDE.md`

