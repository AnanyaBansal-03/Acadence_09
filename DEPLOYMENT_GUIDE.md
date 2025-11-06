# 🚀 Complete Deployment Guide - Acadence LMS (FREE)

## Overview
We'll deploy:
- **Frontend (React)** → Vercel (Free)
- **Backend (Node.js)** → Render (Free)
- **Database** → Supabase (Already hosted, Free tier)

---

# PART 1: Deploy Backend to Render

## Step 1: Prepare Backend for Deployment

### 1.1 Create `.gitignore` in backend folder
Create file: `C:\Users\HP\OneDrive\Desktop\Acadence_09\backend\.gitignore`

```
node_modules/
.env
*.log
```

### 1.2 Update `package.json` 
Open: `C:\Users\HP\OneDrive\Desktop\Acadence_09\backend\package.json`

Make sure it has:
```json
{
  "name": "acadence-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.3 Update server.js PORT
Open: `C:\Users\HP\OneDrive\Desktop\Acadence_09\backend\server.js`

Make sure PORT uses environment variable:
```javascript
const PORT = process.env.PORT || 5000;
```

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)
```powershell
cd C:\Users\HP\OneDrive\Desktop\Acadence_09
git init
git add .
git commit -m "Prepare for deployment"
```

### 2.2 Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `Acadence_09`
3. Set to **Public** or **Private** (your choice)
4. **Don't** initialize with README (you already have code)
5. Click **Create repository**

### 2.3 Push to GitHub
```powershell
git remote add origin https://github.com/YOUR_USERNAME/Acadence_09.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend on Render

### 3.1 Sign Up on Render
1. Go to: https://render.com
2. Click **Get Started**
3. Sign up with **GitHub** (easiest)
4. Authorize Render to access your repositories

### 3.2 Create Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `Acadence_09`
3. Click **Connect**

### 3.3 Configure Web Service
Fill in these settings:

**Basic Settings:**
- **Name:** `acadence-backend` (or any name)
- **Region:** Choose closest to you (e.g., Singapore, Oregon)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

**Instance Type:**
- Select **Free** (0 USD/month)

### 3.4 Add Environment Variables
Click **Advanced** → **Add Environment Variable**

Add these one by one:

```
SUPABASE_URL=https://ujcxhvqxcfxuwjxffotc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY3hodnF4Y2Z4dXdqeGZmb3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk4OTU4OCwiZXhwIjoyMDcyNTY1NTg4fQ.F7fRBj-qXGRaF3St0woTGl5_snU1aU1z0MEgNURZnaI
JWT_SECRET=wcjRNL6sRGsO2DZ4dTggLEw==
PORT=5000
EMAIL_SERVICE=gmail
GMAIL_USER=acadence16@gmail.com
GMAIL_APP_PASSWORD=jnprmkloxmtryhnk
EMAIL_FROM_NAME=Acadence LMS
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Important:** We'll update `FRONTEND_URL` after deploying frontend!

### 3.5 Deploy!
1. Click **Create Web Service**
2. Wait 2-5 minutes for deployment
3. You'll get a URL like: `https://acadence-backend.onrender.com`
4. **Save this URL!** You need it for frontend.

### 3.6 Test Backend
Visit: `https://acadence-backend.onrender.com`
Should show: "Server is running"

---

# PART 2: Deploy Frontend to Vercel

## Step 4: Prepare Frontend for Deployment

### 4.1 Update API URL
Open: `C:\Users\HP\OneDrive\Desktop\Acadence_09\frontend\src\lib\apiConfig.js`

Update to use environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
```

### 4.2 Create `.env.production` in frontend folder
Create file: `C:\Users\HP\OneDrive\Desktop\Acadence_09\frontend\.env.production`

```
VITE_API_URL=https://acadence-backend.onrender.com
```

Replace `acadence-backend.onrender.com` with YOUR actual Render URL!

### 4.3 Test Build Locally (Optional)
```powershell
cd C:\Users\HP\OneDrive\Desktop\Acadence_09\frontend
npm run build
```

Should create a `dist` folder without errors.

---

## Step 5: Deploy Frontend on Vercel

### 5.1 Sign Up on Vercel
1. Go to: https://vercel.com/signup
2. Click **Continue with GitHub**
3. Authorize Vercel

### 5.2 Import Project
1. Click **Add New** → **Project**
2. Find your `Acadence_09` repository
3. Click **Import**

### 5.3 Configure Project
**Framework Preset:** Vite (should auto-detect)

**Root Directory:** `frontend`

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:**
Click **Add** and enter:-p
```
VITE_API_URL = https://acadence-backend.onrender.com
```
(Replace with YOUR Render backend URL)

### 5.4 Deploy!
1. Click **Deploy**
2. Wait 1-2 minutes
3. You'll get a URL like: `https://acadence-09.vercel.app`
4. **Save this URL!**

---

## Step 6: Update Backend CORS

### 6.1 Go Back to Render
1. Open: https://dashboard.render.com
2. Click on your `acadence-backend` service
3. Go to **Environment** tab

### 6.2 Update FRONTEND_URL
Find `FRONTEND_URL` variable and change to:
```
https://acadence-09.vercel.app
```
(Use YOUR actual Vercel URL)

### 6.3 Save & Redeploy
1. Click **Save Changes**
2. Render will automatically redeploy (wait 2-3 minutes)

---

# PART 3: Final Configuration

## Step 7: Update Supabase Settings

### 7.1 Add Vercel URL to Supabase
1. Go to: https://supabase.com/dashboard
2. Select your project: `ujcxhvqxcfxuwjxffotc`
3. Go to **Authentication** → **URL Configuration**
4. Add to **Site URL**: `https://acadence-09.vercel.app`
5. Add to **Redirect URLs**:
   ```
   https://acadence-09.vercel.app
   https://acadence-09.vercel.app/login
   https://acadence-09.vercel.app/dashboard
   ```

---

## Step 8: Test Your Deployed App!

### 8.1 Visit Your App
Open: `https://acadence-09.vercel.app`

### 8.2 Test Features
1. ✅ Sign up new account
2. ✅ Login
3. ✅ Check student dashboard
4. ✅ Check teacher dashboard
5. ✅ Mark attendance
6. ✅ View grades

---

# 📊 Your Deployment URLs

After deployment, you'll have:

```
Frontend: https://acadence-09.vercel.app
Backend:  https://acadence-backend.onrender.com
Database: https://ujcxhvqxcfxuwjxffotc.supabase.co (Already set up)
```

---

# 🔧 Troubleshooting

## Problem: Backend not responding
**Solution:**
1. Check Render logs: Dashboard → Service → Logs
2. Make sure all environment variables are set
3. Check if PORT is set to 5000

## Problem: CORS errors
**Solution:**
1. Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Check backend `server.js` has correct CORS setup:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## Problem: 404 errors on frontend routes
**Solution:**
Add `vercel.json` in frontend folder:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Problem: Environment variables not working
**Solution:**
1. Make sure `.env.production` exists in frontend
2. Rebuild and redeploy:
   - Vercel: Click **Deployments** → **Redeploy**
   - Render: Click **Manual Deploy** → **Deploy latest commit**

---

# 💰 Cost Breakdown

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | FREE | 100GB bandwidth/month |
| **Render** | Free | FREE | 750 hours/month (enough!) |
| **Supabase** | Free | FREE | 500MB database, 2GB bandwidth |
| **Gmail SMTP** | Free | FREE | 500 emails/day |
| **Total** | | **$0/month** | ✅ |

---

# 🚀 Deployment Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] `.gitignore` excludes `node_modules` and `.env`
- [ ] Backend `package.json` has `start` script
- [ ] Frontend uses environment variable for API URL
- [ ] All sensitive data in environment variables

Deployment steps:
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] CORS updated with Vercel URL
- [ ] Supabase URLs updated
- [ ] App tested and working

---

# 📝 Important Notes

## Free Tier Limitations:

### Render:
- ⚠️ **Spins down after 15 minutes of inactivity**
- First request after sleep takes 30-60 seconds
- Solution: Use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your backend every 14 minutes

### Vercel:
- ✅ No sleep time
- ✅ Fast global CDN
- ✅ Automatic HTTPS

### Supabase:
- ✅ Database stays active
- ⚠️ Pauses after 7 days of inactivity (just login to wake it up)

---

# 🔄 How to Update After Deployment

When you make changes:

### Update Frontend:
```powershell
cd C:\Users\HP\OneDrive\Desktop\Acadence_09
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel automatically redeploys! ✨

### Update Backend:
```powershell
cd C:\Users\HP\OneDrive\Desktop\Acadence_09
git add .
git commit -m "Update backend"
git push origin main
```
Render automatically redeploys! ✨

---

# 🌟 Custom Domain (Optional)

If you want `acadence.com` instead of `.vercel.app`:

1. Buy domain from Namecheap/GoDaddy (~$10/year)
2. In Vercel: Go to **Settings** → **Domains**
3. Add your domain
4. Update DNS records as Vercel instructs
5. Done! ✨

---

# 🆘 Need Help?

**Render Docs:** https://render.com/docs
**Vercel Docs:** https://vercel.com/docs
**Supabase Docs:** https://supabase.com/docs

---

# ✅ You're Ready!

Follow these steps in order, and your Acadence LMS will be live on the internet, completely FREE! 🎉

Your app will be accessible from anywhere in the world at:
**https://acadence-09.vercel.app** 🌍
