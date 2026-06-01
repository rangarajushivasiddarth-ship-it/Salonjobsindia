# PHASE 3: BUILD ANDROID APP - DETAILED BREAKDOWN

**Time: 45 minutes**
**What you're doing:** Creating an Android app wrapper that opens your website

---

## WHAT IS A TWA?

**Simple:**
- TWA = Trusted Web Activity
- Your website + Android wrapper = Android app
- Users download from Play Store
- Opens your website when they tap the icon
- Looks like a native app!

```
User taps app icon
        ↓
Opens your website (salonjobsindia.com)
        ↓
Shows in full-screen Android view
        ↓
Looks like a native app
```

---

# STEP 1: DOWNLOAD ANDROID STUDIO

**What to do:**

1. Open your browser
2. Go to: https://developer.android.com/studio
3. Click **"Download Android Studio"** button
4. Accept terms and conditions
5. Click **"Download"** (900 MB file)
6. Wait for download (5-15 minutes)
7. Once downloaded, double-click the installer
8. Follow the wizard:
   - Click "Next" 
   - Choose install location (default is fine)
   - Check all default options
   - Click "Install"
9. Wait (5-10 minutes for installation)
10. Click "Finish"
11. Android Studio opens for first time
12. Click "I don't have a previous version" if asked
13. You'll see: "Welcome to Android Studio"

**Time:** 25-35 minutes

---

# STEP 2: CREATE NEW PROJECT

**What to do:**

1. In Android Studio, click: **"New Project"** (top left)
2. A dialog opens: "New Project"
3. You see template options
4. Look for and click: **"Empty Activity"**
5. Click **"Next"**
6. Now fill in project details:

```
Name: SalonJobsIndia
(This is your project name)

Package name: com.fitonze.salonjobsindia
(This is IMPORTANT - it's your app's unique ID)

Save location: Desktop or your chosen folder
(Where project will be saved)

Language: Kotlin or Java
(Choose Kotlin - modern and recommended)

Minimum SDK: API 24
(Means app works on Android 7.0 and above)
```

7. Click **"Finish"**
8. Android Studio starts creating project
9. You see: "Syncing Gradle..." (takes 1-3 minutes)
10. Once done, you see code editor

**Important:**
- Package name is like your app's passport number
- Never change it after creating
- Must be unique (no other app can have this name)

**Time:** 5 minutes + waiting

---

# STEP 3: UNDERSTAND THE PROJECT STRUCTURE

**What you see on the left side:**

```
SalonJobsIndia/
├── app/                          (Your app code folder)
│   ├── src/                      (Source code)
│   │   ├── main/                 (Main app files)
│   │   │   ├── AndroidManifest.xml    ← WE'LL EDIT THIS
│   │   │   ├── java/
│   │   │   │   └── com/fitonze/salonjobsindia/
│   │   │   │       └── MainActivity.kt    ← WE'LL EDIT THIS
│   │   │   └── res/              (Resources: icons, colors)
│   │   │       ├── drawable/
│   │   │       ├── values/
│   │   │       │   ├── strings.xml
│   │   │       │   └── colors.xml
│   │   │       └── mipmap/       (App icons)
│   ├── build.gradle              (Dependencies)
│
├── settings.gradle
├── build.gradle
└── local.properties
```

**Files we'll edit:**
1. `AndroidManifest.xml` - App configuration
2. `MainActivity.kt` - App code that opens your website

---

# STEP 4: EDIT ANDROIDMANIFEST.XML

**What it is:**
- Configuration file for your app
- Tells Android how app works
- Connects to your website
- Requests permissions

**How to edit:**

1. In left sidebar, click arrow to expand: **app**
2. Click arrow to expand: **src**
3. Click arrow to expand: **main**
4. You see: **AndroidManifest.xml** file
5. Double-click it
6. A file opens with XML code
7. You see existing code

**What to do:**

Replace the ENTIRE file with this code:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.fitonze.salonjobsindia">

    <!-- Permissions your app needs -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.SalonJobsIndia">

        <!-- Main Activity (what shows when app opens) -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@android:style/Theme.NoTitleBar">

            <!-- Launcher - makes it the main screen -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- TWA Magic - connects to your website -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="salonjobsindia.com"
                    android:path="/" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

**What this does:**

| Line | What it does |
|------|-------------|
| `<uses-permission android:name="android.permission.INTERNET" />` | Allows internet access |
| `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />` | Allows location access (for job search) |
| `<uses-permission android:name="android.permission.CAMERA" />` | Allows camera access (for profile pic) |
| `android:scheme="https"` | Only use secure connections |
| `android:host="salonjobsindia.com"` | Your website domain |
| `android:path="/"` | Entire website |
| `android:launchMode="singleTask"` | Only one instance of app runs |

**Steps to replace:**

1. Select all code: **Ctrl+A** (Windows) or **Cmd+A** (Mac)
2. Delete it
3. Paste the new code above
4. Press **Ctrl+S** to save

**Time:** 3 minutes

---

# STEP 5: EDIT MAINACTIVITY.KT

**What it is:**
- The code that runs when app opens
- Opens your website in Android browser
- Makes it look like a native app

**How to edit:**

1. In left sidebar, expand: **app** → **src** → **main** → **java**
2. Click arrow to expand: **com** → **fitonze** → **salonjobsindia**
3. You see: **MainActivity.kt** file
4. Double-click it
5. Kotlin code appears

**What to do:**

Replace the ENTIRE content with this code:

```kotlin
package com.fitonze.salonjobsindia

import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Create a custom browser view
        val intent = CustomTabsIntent.Builder()
            .setDefaultColorSchemeParams(
                CustomTabsIntent.ColorSchemeParams.Builder()
                    .setToolbarColor(0xFFD4AF37.toInt()) // Gold color
                    .build()
            )
            .setShowTitle(false) // Hide URL bar
            .build()

        // Open your website
        intent.launchUrl(this, Uri.parse("https://salonjobsindia.com"))
        
        // Close this activity (we don't need it)
        finish()
    }
}
```

**What this does:**

| Line | What it does |
|------|-------------|
| `import android.net.Uri` | Import for opening URLs |
| `import androidx.browser.customtabs.CustomTabsIntent` | Import for custom browser |
| `CustomTabsIntent.Builder()` | Create custom browser view |
| `.setToolbarColor(0xFFD4AF37.toInt())` | Set toolbar color to gold (#D4AF37) |
| `.setShowTitle(false)` | Hide URL bar (looks more native) |
| `intent.launchUrl(this, Uri.parse(...))` | Open your website |
| `finish()` | Close this screen |

**Steps to replace:**

1. Select all: **Ctrl+A**
2. Delete
3. Paste new code
4. Press **Ctrl+S** to save

**Time:** 2 minutes

---

# STEP 6: ADD DEPENDENCIES

**What are dependencies?**
- Extra code libraries your app needs
- Like adding tools to your toolbox
- Android Studio will install them automatically

**How to add:**

1. In left sidebar, find: **build.gradle** (under **app**)
2. Double-click it
3. Look for section: `dependencies {`
4. Find the closing `}`
5. Before the closing `}`, add these lines:

```gradle
// TWA support library
implementation 'androidx.browser:browser:1.5.0'

// Google Play Services
implementation 'com.google.android.gms:play-services-safetynet:18.0.1'
```

6. Press **Ctrl+S** to save
7. You'll see notification: **"Sync Now"** button appears at top
8. Click **"Sync Now"**
9. Wait for sync (1-3 minutes)
10. You see: "Gradle Sync Completed Successfully"

**Time:** 3 minutes

---

# STEP 7: ADD APP ICON

**What to do:**

1. Right-click on **res** folder (in left sidebar)
2. Select: **New** → **Image Asset**
3. A dialog opens: "Configure Image Asset"
4. For "Asset Type", select: **"Launcher Icons (Adaptive and Legacy)"**
5. Under "Path", click folder icon
6. Navigate to: `/vercel/share/v0-project/public/images/logo.png`
7. Select your logo
8. Click **"Open"**
9. You see preview
10. Click **"Next"**
11. Click **"Finish"**

Android Studio creates all required icon sizes automatically!

**Time:** 2 minutes

---

# STEP 8: UPDATE APP NAME & COLORS

**Add App Name:**

1. In left sidebar, go to: **res** → **values** → **strings.xml**
2. Double-click it
3. You see XML with strings
4. Look for: `<string name="app_name">` 
5. Change value to: `Salon Jobs India`
6. Save (**Ctrl+S**)

**Add Color:**

1. In left sidebar, go to: **res** → **values** → **colors.xml**
2. Double-click it
3. You see color definitions
4. Add this line before the closing `</resources>`:
```xml
<color name="primary">#FFD4AF37</color>
```
5. Save (**Ctrl+S**)

**Time:** 2 minutes

---

# STEP 9: BUILD RELEASE BUNDLE

**What is it?**
- Final app file that you upload to Play Store
- File format: `.aab` (Android App Bundle)
- Size: Usually 5-15 MB

**How to build:**

1. Click menu: **Build** → **Generate Signed Bundle / APK**
2. Dialog opens: "Generate Signed Bundle or APK"
3. Select: **"Android App Bundle"** radio button
4. Click **"Next"**
5. For "Key store":
   - First time? Click **"Create new..."**
   - Dialog opens: "Create New Key Store"

**Fill in Keystore Details:**

```
Key Store Path: 
  Choose a safe location (Desktop or Documents)
  Name: salonjobsindia.jks

Key store password: 
  Create STRONG password (8+ characters)
  Example: SalonJobs@2024
  REMEMBER THIS!

Confirm password:
  Repeat the password above

Alias: salonjobsindia_key

Password: (Same as key store password)

Validity (years): 30

Certificate:
  First and Last Name: Your Name
  Organization Unit: Fitonze
  Organization: Fitonze Private Limited
  City: Your City
  State/Province: Your State
  Country Code: IN
```

6. Click **"OK"**
7. Back to "Generate Signed Bundle"
8. Select: **"V2 Signing (Recommended)"**
9. Click **"Finish"**

**Wait for build:**

1. Android Studio starts building
2. You see progress at bottom
3. Takes 2-5 minutes
4. When done: "Build successful!"
5. You see message with file path

**Find your file:**

```
Usually in:
Windows: C:\Users\YourName\ProjectFolder\app\release\app-release.aab
Mac: ~/ProjectFolder/app/release/app-release.aab
```

**⚠️ CRITICAL:**

- Find the `.jks` file (signing key)
- Make 3 backup copies:
  1. Original location
  2. Google Drive (cloud backup)
  3. External hard drive (safe backup)
- Never lose this file!
- Never share this file!

**Time:** 10 minutes

---

# STEP 10: VERIFY BUILD

**What to do:**

1. Find your `app-release.aab` file
2. Check file size: Should be 5-15 MB
3. If smaller or larger, something is wrong
4. If correct size, you're done with Phase 3!

**Time:** 2 minutes

---

# SUMMARY OF PHASE 3

| Step | Time | What You Do |
|------|------|-----------|
| 1 | 30 min | Download Android Studio |
| 2 | 5 min | Create new TWA project |
| 3 | 2 min | Learn project structure |
| 4 | 3 min | Edit AndroidManifest.xml |
| 5 | 2 min | Edit MainActivity.kt |
| 6 | 3 min | Add dependencies (Gradle sync) |
| 7 | 2 min | Add app icon |
| 8 | 2 min | Add app name and colors |
| 9 | 10 min | Build release bundle (signing key) |
| 10 | 2 min | Verify build |
| **TOTAL** | **45 min** | **TWA is built!** |

---

# WHAT YOU HAVE AFTER PHASE 3

```
✓ Android project created
✓ Connected to your website (salonjobsindia.com)
✓ App icon added
✓ App name set
✓ Permissions configured
✓ Signing key created (SAVED!)
✓ Release bundle built (app-release.aab)
✓ Ready for Google Play Store!
```

---

# NEXT: PHASE 4

Once Phase 3 is complete:
1. You have: `app-release.aab` file
2. You upload this to Google Play Console
3. Add screenshots and descriptions
4. Submit for review
5. Google reviews and approves (2-24 hours)
6. App goes LIVE! 🎉

---

# KEY FILES TO REMEMBER

After Phase 3, these are critical:

```
app-release.aab (your app file)
  → Upload to Play Store

salonjobsindia.jks (your signing key)
  → BACK UP 3 COPIES!
  → NEVER LOSE!
```

---

# TROUBLESHOOTING PHASE 3

**Problem: "Build fails"**
→ Check: Java version (should be 11+)
→ Try: Cleaning build → Build → Clean Project

**Problem: "Gradle sync fails"**
→ Click: "Sync Now" again
→ If still fails, check internet connection

**Problem: "Can't find MainActivity.kt"**
→ In left sidebar: app → src → main → java
→ Should see folder with package name

**Problem: "Icon doesn't appear"**
→ Check: You selected a real image file
→ Not a placeholder

**Problem: "app-release.aab is too large (100+ MB)"**
→ Something is wrong
→ Rebuild and check again

**Problem: "Can't find app-release.aab"**
→ In Android Studio: View → Tool Windows → Build
→ Look for message with file path

---

# YOU'RE DONE WITH PHASE 3! ✅

Your TWA is built and ready!

Next: Go to Phase 4 (Submit to Google Play Store)

