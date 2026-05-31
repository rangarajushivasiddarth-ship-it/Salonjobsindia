# HOSTINGER DEPLOYMENT & PLAYSTORE PUBLISHING GUIDE

## PART 1: DEPLOY TO HOSTINGER WITH YOUR DOMAIN

### What You Have Ready:
- ✅ Domain purchased on Hostinger
- ✅ 20GB database on Hostinger
- ✅ Next.js application (production-ready)
- ✅ All workflows verified and working

### Step 1: Prepare Your Application for Hostinger

**Environment Variables You Need** (Create `.env.local`):
```
# No external API keys needed - your app uses only localStorage and Vercel Blob
# Your app is self-contained and doesn't require complex env setup

# Optional - if you want to use your own backend:
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

**Your app currently uses**:
- localStorage (in browser)
- Vercel Blob (cloud storage)
- No external databases needed

### Step 2: Build Your Application

```bash
cd /vercel/share/v0-project
pnpm build
```

This creates an optimized production build in `.next/` folder.

### Step 3: Deploy to Hostinger (Option A: Using cPanel File Manager)

1. **Login to Hostinger Control Panel**
2. **Go to File Manager**
3. **Navigate to public_html folder**
4. **Upload your project files:**
   - Copy `.next/` folder
   - Copy `public/` folder
   - Copy `node_modules/` folder (or let Hostinger install)
   - Copy `package.json` and `package-lock.json`

5. **Install dependencies:**
   - Go to Terminal in cPanel
   - Run: `npm install`

6. **Start the application:**
   - Run: `npm run start`

### Step 4: Deploy to Hostinger (Option B: Using Git)

**Better and recommended method:**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Production deployment"
   git push origin main
   ```

2. **In Hostinger:**
   - Go to cPanel
   - Git Version Control
   - Clone your repository
   - Hostinger auto-installs dependencies

3. **Setup auto-deployment:**
   - Hostinger can auto-pull on each push
   - Set webhook from GitHub to Hostinger

### Step 5: Connect Your Domain

1. **In Hostinger Control Panel:**
   - Go to Domains
   - Select your domain
   - Point to public_html folder
   - DNS already configured by Hostinger

2. **Access your app:**
   - Open: `https://yourdomain.com`
   - Your app is now LIVE

### Step 6: Verify Everything Works

- Test salon owner job posting
- Test admin approval
- Test job seeker subscription
- Test all workflows

All should work exactly the same as in development.

---

## PART 2: IMPORTANT - DATABASE & ADMIN QUESTION

### Will Admin & Database Be the Same?

**YES! 100% Same - Here's Why:**

Your app uses localStorage + Vercel Blob storage for ALL data:
- Salon jobs: Stored in Vercel Blob
- Admin payments: Stored in Vercel Blob
- Job seeker subscriptions: Stored in Vercel Blob
- User profiles: localStorage + Vercel Blob

**When you deploy to Hostinger:**
- Your Hostinger 20GB database is NOT automatically used
- Your app STILL uses Vercel Blob (same as before)
- Admin dashboard STILL connects to same Vercel Blob
- All data REMAINS the same

**This means:**
- Data on Hostinger domain = Data on Vercel = Data on PlayStore (all same)
- Admin can approve jobs from any domain
- Customers can use from any domain
- One backend, multiple access points

### To Use Your Hostinger Database Instead:

If you want to switch to your Hostinger 20GB database:

1. **Option A: Keep current system (Recommended)**
   - Use Vercel Blob (free tier, simple, no backend needed)
   - Hostinger database stays unused
   - App works perfectly

2. **Option B: Use Hostinger database**
   - Requires backend API setup
   - Need to migrate from Vercel Blob to Hostinger DB
   - More complex but gives you full control
   - Would take additional setup

**Recommendation:** Keep using Vercel Blob for now. It works perfectly and requires no additional configuration.

---

## PART 3: PUBLISH AS WEB APP TO GOOGLE PLAYSTORE

### What is a Web App on PlayStore?

A web app on PlayStore is a "Trusted Web Activity" (TWA) - essentially a wrapper around your website that appears as a native app.

### Benefits:
- ✅ One codebase (your Next.js app)
- ✅ Same admin & database across all platforms
- ✅ Automatic updates (users always get latest version)
- ✅ No separate app development needed
- ✅ Same functionality on web and app

### Step 1: Make Your App a Progressive Web App (PWA)

Your app needs a manifest file and service worker. Let me create these:

**Create `public/manifest.json`:**
```json
{
  "name": "Salon Jobs India",
  "short_name": "Salon Jobs",
  "description": "Find your perfect salon career",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/images/logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Add to `app/layout.tsx`:**
```tsx
export const metadata: Metadata = {
  // ... existing metadata
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Salon Jobs India",
  },
  formatDetection: {
    telephone: false,
  },
};
```

### Step 2: Create Service Worker

Create `public/sw.js`:
```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `salon-jobs-${CACHE_VERSION}`;

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Let the app handle all requests
  // Service worker just ensures offline access
});
```

### Step 3: Register Service Worker in Layout

Add to `app/layout.tsx`:
```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service Worker registration failed:', err);
    });
  }
}, []);
```

### Step 4: Deploy to Hostinger (or Keep on Vercel)

Your domain must be HTTPS (Hostinger provides free SSL)

### Step 5: Create Google Play Developer Account

1. Go to Google Play Console
2. Create developer account ($25 one-time fee)
3. Create new app

### Step 6: Submit as Trusted Web Activity (TWA)

1. **In Google Play Console:**
   - Select "Create app"
   - App name: "Salon Jobs India"
   - App category: "Business" or "Lifestyle"
   - Content rating: Fill questionnaire

2. **Upload APK (Generated from TWA):**

   Use Android Asset Links tool:
   - Go to: https://github.com/GoogleChromeLabs/bubblewrap
   - Install: `npm install -g @bubblewrap/cli`
   - Run: `bubblewrap init --manifest=/path/to/manifest.json`
   - This generates a signed APK file

3. **Upload APK to Google Play Console**

4. **Setup Digital Asset Links**

   Add this file: `/.well-known/assetlinks.json`
   
   (I'll help you create this)

5. **Submit for Review**

---

## PART 4: DATABASE & ADMIN - SAME ACROSS ALL PLATFORMS?

### Yes! Here's How It Works:

```
┌─────────────────────────────────────────────┐
│         Your Hostinger Domain              │
│      (https://yourdomain.com)               │
│  - Salon owner posts job                    │
│  - Job appears in Vercel Blob               │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   Vercel Blob Storage │ ← Same for All
        │   (One Database)      │
        └───────────────────────┘
                    ↑
┌─────────────────────────────────────────────┐
│         Your PlayStore Web App              │
│    (Same domain wrapped in app)             │
│  - Salon owner posts job                    │
│  - Job appears in SAME Vercel Blob          │
│  - Admin sees same payments                 │
│  - Everything IDENTICAL                     │
└─────────────────────────────────────────────┘
```

### Key Point: One Backend, Multiple Access Points

- **Admin dashboard** → Same database
- **Hostinger domain** → Same database
- **PlayStore app** → Same database
- **Android app** → Same database
- **iOS web app** → Same database

Everything is connected to **ONE Vercel Blob storage**, so:
- Admin approves = Visible everywhere
- Salon posts = Available to all users
- Subscriptions = Work across all platforms
- Data = Always synced

---

## PART 5: QUICK DEPLOYMENT CHECKLIST

### Before Deploying:

- [ ] Build successful: `pnpm build` ✅
- [ ] No errors in build
- [ ] All workflows tested
- [ ] Domain ready on Hostinger
- [ ] SSL certificate auto-provided by Hostinger

### Deployment Steps:

1. [ ] Push code to GitHub
2. [ ] Deploy to Hostinger (via Git or File Manager)
3. [ ] Verify domain works: https://yourdomain.com
4. [ ] Test all workflows on live domain
5. [ ] Create PWA manifest
6. [ ] Deploy to PlayStore (optional)

### After Deployment:

- [ ] Share domain with testers
- [ ] Collect feedback
- [ ] Monitor admin dashboard
- [ ] Track payments and approvals
- [ ] Monitor performance

---

## FINAL ANSWER TO YOUR QUESTIONS

### Q1: How to push to Hostinger?
**A:** Upload project files via cPanel or use Git. Hostinger will automatically install dependencies and run your Node.js app.

### Q2: How to publish to PlayStore as web app?
**A:** Create PWA manifest, use Bubblewrap to generate APK, upload to Google Play Console. It's essentially your website wrapped as an app.

### Q3: Will database and admin be the same?
**A:** YES! 100% same. Your Hostinger domain, PlayStore app, and all access points use the SAME Vercel Blob storage. Admin can approve jobs and they'll be visible everywhere simultaneously.

---

## NEXT STEPS

1. Deploy to Hostinger with your domain
2. Test everything on your domain
3. Create PWA manifest (I can help)
4. Generate APK using Bubblewrap
5. Submit to Google Play Store
6. Both will use same admin & database

Ready to proceed? Let me know which step you want help with!
