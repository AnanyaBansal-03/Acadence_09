# 🚀 Quick Deployment Guide - Google Classroom Integration

## 📋 What's Happening:
Your frontend is trying to call `/api/integrations/*` endpoints on your production backend (acadence-backend.onrender.com), but those routes don't exist there yet because:
- ✅ You created the routes locally
- ❌ You haven't pushed them to GitHub yet
- ❌ Render hasn't deployed the new code

---

## ✅ Step 1: Commit & Push to GitHub

Open PowerShell in your project folder and run:

```powershell
cd c:\Users\HP\OneDrive\Desktop\Acadence_09

# Check what files changed
git status

# Add all new integration files
git add backend/routes/integrations.js
git add backend/services/googleClassroomService.js
git add backend/scripts/createIntegrationsTables.sql
git add frontend/src/components/student/GoogleClassroomIntegration.jsx
git add frontend/src/components/student/StudentIntegrations.jsx
git add backend/.env.integrations.example

# Commit the changes
git commit -m "Add Google Classroom integration with OAuth2"

# Push to GitHub
git push origin main
```

---

## ✅ Step 2: Render Will Auto-Deploy

After you push to GitHub:
1. Go to https://dashboard.render.com
2. Find your `acadence-backend` service
3. Render will automatically detect the changes and start deploying
4. Wait for deployment to complete (usually 2-3 minutes)
5. You'll see "Deploy succeeded" message

---

## ✅ Step 3: Add Environment Variables to Render

While waiting for deployment:

1. In Render dashboard, click your backend service
2. Go to **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add these 4 variables:

```
Name: GOOGLE_CLIENT_ID
Value: 1025040741191-q68ju426dkvvgvt1na8iiojobs3ju82q.apps.googleusercontent.com

Name: GOOGLE_CLIENT_SECRET
Value: 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

Name: GOOGLE_REDIRECT_URI
Value: https://acadence-backend.onrender.com/api/integrations/google-classroom/callback

Name: FRONTEND_URL
Value: https://acadence9.vercel.app
```

5. Click **"Save Changes"** (This will trigger another deploy - that's OK!)

---

## ✅ Step 4: Create Database Tables in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/ujcxhvqxcfxuwjxffotc
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Copy ALL the SQL from: `backend/scripts/createIntegrationsTables.sql`
5. Paste into the SQL editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

---

## ✅ Step 5: Test the Integration!

Once Render shows "Deploy succeeded":

1. Go to your live site: https://acadence9.vercel.app
2. Login as a student
3. Click "Connected Apps" in the sidebar
4. Click "Connect Now" on Google Classroom
5. Authorize with your Google account
6. Click "Sync Now" to fetch courses and assignments

---

## 🔍 How to Check if Backend is Deployed:

Visit this URL in your browser:
```
https://acadence-backend.onrender.com/api/integrations/google-classroom/status
```

**Before deployment:** 404 error (route not found)
**After deployment:** JSON response like `{"connected": false, "platform": "google_classroom"}`

---

## 📝 Quick Checklist:

- [ ] Run `git add`, `git commit`, `git push` commands
- [ ] Wait for Render to deploy (check dashboard)
- [ ] Add 4 environment variables to Render
- [ ] Run SQL in Supabase SQL Editor
- [ ] Test the integration on live site

---

## 🆘 Troubleshooting:

**Still getting 404 after pushing to GitHub?**
- Check Render dashboard - deployment might have failed
- Check the logs in Render for errors
- Make sure you committed the `backend/routes/integrations.js` file

**"Invalid credentials" error?**
- Double-check environment variables in Render
- Make sure you saved them after adding

**"Table does not exist" error?**
- Run the SQL script in Supabase
- Check Supabase > Database > Tables to verify tables were created

---

## 🎉 After Everything Works:

You'll be able to:
✅ Connect Google Classroom from production site
✅ Sync courses and assignments
✅ See them in the Connected Apps dashboard
✅ Auto-sync every 3 hours

---

**Start with Step 1 - Commit and Push to GitHub!** 🚀
