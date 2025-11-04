# 🚀 Quick Deployment Checklist

## ✅ Before You Start
- [ ] Code is working locally (frontend + backend)
- [ ] You have a GitHub account
- [ ] You have the following accounts ready to create:
  - Vercel account (for frontend)
  - Render account (for backend)

---

## 📦 STEP 1: Push to GitHub (10 minutes)

```powershell
# In your project root
cd C:\Users\HP\OneDrive\Desktop\Acadence_09

# Initialize git (if not done)
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub: https://github.com/new
# Name it: Acadence_09

# Push code
git remote add origin https://github.com/YOUR_USERNAME/Acadence_09.git
git branch -M main
git push -u origin main
```

**Checkpoint:** ✅ Code is on GitHub

---

## 🖥️ STEP 2: Deploy Backend to Render (15 minutes)

### 2.1 Sign Up
- Go to: https://render.com
- Click "Get Started" → Sign up with GitHub

### 2.2 Create Web Service
1. Click **New +** → **Web Service**
2. Connect repository: `Acadence_09`
3. Fill in:
   - **Name:** `acadence-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### 2.3 Add Environment Variables
Click "Advanced" → Add these:

```
SUPABASE_URL=https://ujcxhvqxcfxuwjxffotc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY3hodnF4Y2Z4dXdqeGZmb3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk4OTU4OCwiZXhwIjoyMDcyNTY1NTg4fQ.F7fRBj-qXGRaF3St0woTGl5_snU1aU1z0MEgNURZnaI
JWT_SECRET=wcjRNL6sRGsO2DZ4dTggLEw==
PORT=5000
EMAIL_SERVICE=gmail
GMAIL_USER=acadence16@gmail.com
GMAIL_APP_PASSWORD=jnprmkloxmtryhnk
EMAIL_FROM_NAME=Acadence LMS
FRONTEND_URL=https://temporary-url.vercel.app
```

### 2.4 Deploy
- Click "Create Web Service"
- Wait 3-5 minutes
- **COPY YOUR BACKEND URL:** `https://acadence-backend-XXXX.onrender.com`

**Checkpoint:** ✅ Backend is live

---

## 🌐 STEP 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Update .env.production
Open: `frontend\.env.production`
Change to YOUR Render URL:
```
VITE_API_URL=https://acadence-backend-XXXX.onrender.com
```

### 3.2 Push Changes
```powershell
git add .
git commit -m "Update production API URL"
git push origin main
```

### 3.3 Sign Up on Vercel
- Go to: https://vercel.com/signup
- Click "Continue with GitHub"

### 3.4 Import Project
1. Click **Add New** → **Project**
2. Import `Acadence_09`
3. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3.5 Add Environment Variable
```
VITE_API_URL = https://acadence-backend-XXXX.onrender.com
```
(Use YOUR Render URL)

### 3.6 Deploy
- Click "Deploy"
- Wait 2-3 minutes
- **COPY YOUR FRONTEND URL:** `https://acadence-09.vercel.app`

**Checkpoint:** ✅ Frontend is live

---

## 🔧 STEP 4: Update Backend CORS (5 minutes)

### 4.1 Update Render Environment
1. Go to Render Dashboard
2. Click your `acadence-backend` service
3. Go to "Environment"
4. Find `FRONTEND_URL` and change to:
   ```
   https://acadence-09.vercel.app
   ```
   (Use YOUR Vercel URL)
5. Click "Save Changes"
6. Wait for automatic redeploy (2-3 minutes)

**Checkpoint:** ✅ CORS configured

---

## 🎯 STEP 5: Test Your App! (5 minutes)

Visit your app: `https://acadence-09.vercel.app`

Test these features:
- [ ] Homepage loads
- [ ] Can signup new account
- [ ] Can login
- [ ] Student dashboard works
- [ ] Teacher dashboard works
- [ ] Can mark attendance
- [ ] Can view grades

**Checkpoint:** ✅ Everything works!

---

## 🎉 YOU'RE LIVE!

Your app is now deployed and accessible worldwide!

**Frontend:** https://acadence-09.vercel.app
**Backend:** https://acadence-backend-XXXX.onrender.com

---

## 📱 Share Your App

You can now share the link with anyone:
- Students can access from phones/laptops
- Teachers can mark attendance
- Automatic weekly emails will be sent
- QR code scanning works
- Everything runs smoothly!

---

## 💡 Important Notes

### Free Tier Limits:
- **Render:** Backend sleeps after 15 min inactivity
  - First request takes 30-60 seconds to wake up
  - Solution: Pin important pages or use UptimeRobot
  
- **Vercel:** No sleep! ✨
  - Always fast
  - 100GB bandwidth/month (plenty!)

### Updating Your App:
```powershell
# Make changes
git add .
git commit -m "Update description"
git push origin main
```
Both Vercel and Render auto-deploy! 🚀

---

## 🆘 Having Issues?

### Backend not responding:
- Check Render logs: Dashboard → Service → Logs
- Make sure all env variables are set

### CORS errors:
- Double-check `FRONTEND_URL` matches Vercel URL exactly

### Frontend shows errors:
- Check browser console (F12)
- Verify `VITE_API_URL` is correct

---

## 📞 Support

**Render Docs:** https://render.com/docs
**Vercel Docs:** https://vercel.com/docs

---

**Total Time:** ~45 minutes
**Total Cost:** $0/month (FREE!) 💰
**Global Access:** ✅ Available worldwide 🌍

Congratulations! Your Acadence LMS is now live! 🎊
