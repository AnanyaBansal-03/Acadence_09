# 🔗 Google Classroom Integration - Complete Setup Guide

## 📋 Overview
This guide will help you set up Google Classroom integration in Acadence, allowing students to:
- ✅ Connect their Google Classroom account
- 📚 Sync courses automatically
- 📝 View assignments with due dates
- 🔄 Auto-sync every 3 hours
- 🎯 See everything in one unified dashboard

---

## 🚀 Step 1: Set Up Google Cloud Project

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project name: `Acadence Integration`
4. Click **"Create"**

### 1.2 Enable Google Classroom API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Classroom API"**
3. Click on it and press **"Enable"**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: Acadence
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **"Save and Continue"**
   
4. Add Scopes:
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `https://www.googleapis.com/auth/classroom.courses.readonly`
     - `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click **"Update"** → **"Save and Continue"**
   
5. Add Test Users (for development):
   - Add your test Gmail accounts
   - Click **"Save and Continue"**

6. Back to Credentials page:
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - **Application type**: Web application
   - **Name**: Acadence Web Client
   
7. Add Authorized redirect URIs:
   ```
   http://localhost:5000/api/integrations/google-classroom/callback
   ```
   For production, also add:
   ```
   https://your-domain.com/api/integrations/google-classroom/callback
   ```

8. Click **"Create"**
9. **Copy your Client ID and Client Secret** (you'll need these!)

---

## 🗄️ Step 2: Set Up Database Tables

### 2.1 Run SQL Script

Run this SQL script in your Supabase SQL Editor:

```sql
-- Copy the content from backend/scripts/createIntegrationsTables.sql
```

Or run it via command line:

```bash
# If using Supabase CLI
supabase db push

# Or directly via psql
psql -h your-supabase-host -U postgres -d postgres -f backend/scripts/createIntegrationsTables.sql
```

Verify tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'user_integrations', 
  'external_assignments', 
  'external_courses', 
  'integration_sync_logs'
);
```

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Backend Configuration

Add these variables to your `backend/.env` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-classroom/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173

# Existing variables (keep these)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-jwt-secret
PORT=5000
```

### 3.2 Update Frontend API Config (if needed)

Check `frontend/src/lib/apiConfig.js`:
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

---

## 📦 Step 4: Install Dependencies

### 4.1 Backend Dependencies

```bash
cd backend
npm install googleapis passport passport-google-oauth20
```

### 4.2 Verify Installation

```bash
npm list googleapis
# Should show: googleapis@XXX.X.X
```

---

## 🎯 Step 5: Test the Integration

### 5.1 Start Backend Server

```bash
cd backend
npm start
# or
node server.js
```

You should see:
```
✅ Supabase connected successfully!
🚀 Server running on http://localhost:5000
🔗 Initializing Google Classroom auto-sync service...
✅ Integration auto-sync service started (runs every 3 hours)
```

### 5.2 Start Frontend

```bash
cd frontend
npm run dev
```

### 5.3 Test OAuth Flow

1. **Login as a student** in Acadence
2. Navigate to **"Connected Apps"** in the sidebar
3. Click **"Connect Now"** on Google Classroom card
4. You'll be redirected to Google OAuth consent screen
5. Choose your Google account and grant permissions
6. After authorization, you'll be redirected back to Acadence
7. You should see **"Connected"** status ✅

### 5.4 Test Data Sync

1. Click **"Sync Now"** button
2. Check browser console for sync status
3. After sync completes, you should see:
   - Your Google Classroom courses
   - Your assignments with due dates
   - Statistics (total courses, pending assignments, etc.)

---

## 🧪 Step 6: Testing & Debugging

### 6.1 Test API Endpoints

Use Postman or curl to test:

**Get Auth URL:**
```bash
curl -X GET http://localhost:5000/api/integrations/google-classroom/auth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check Connection Status:**
```bash
curl -X GET http://localhost:5000/api/integrations/google-classroom/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Manual Sync:**
```bash
curl -X POST http://localhost:5000/api/integrations/google-classroom/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6.2 Check Database

Verify data was synced:
```sql
-- Check integrations
SELECT * FROM user_integrations WHERE platform = 'google_classroom';

-- Check synced courses
SELECT * FROM external_courses;

-- Check synced assignments
SELECT * FROM external_assignments;

-- Check sync logs
SELECT * FROM integration_sync_logs ORDER BY created_at DESC LIMIT 10;
```

### 6.3 Common Issues & Solutions

**Issue: "Invalid redirect URI"**
- Solution: Make sure redirect URI in Google Cloud Console matches exactly: `http://localhost:5000/api/integrations/google-classroom/callback`

**Issue: "Access blocked: This app's request is invalid"**
- Solution: Add test users in Google Cloud Console OAuth consent screen

**Issue: "Token expired"**
- Solution: Auto-refresh is handled automatically. Check `token_expiry` in database.

**Issue: No courses/assignments showing**
- Solution: 
  1. Check if you have active courses in Google Classroom
  2. Check sync logs: `SELECT * FROM integration_sync_logs ORDER BY created_at DESC;`
  3. Look for error messages in backend console

---

## 🔄 Step 7: Auto-Sync Configuration

The system automatically syncs every 3 hours. To modify:

Edit `backend/services/integrationSyncService.js`:
```javascript
// Change this line (line ~28)
this.syncJob = cron.schedule('0 */3 * * *', async () => {
  // Runs every 3 hours

// Options:
// '*/5 * * * *'    - Every 5 minutes (for testing)
// '0 */1 * * *'    - Every hour
// '0 */6 * * *'    - Every 6 hours
// '0 0 * * *'      - Daily at midnight
```

---

## 🚀 Step 8: Production Deployment

### 8.1 Update OAuth Redirect URIs

In Google Cloud Console, add production URLs:
```
https://yourdomain.com/api/integrations/google-classroom/callback
```

### 8.2 Update Environment Variables

Production `.env`:
```env
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integrations/google-classroom/callback
FRONTEND_URL=https://yourdomain.com
```

### 8.3 Security Checklist

- ✅ Use HTTPS in production
- ✅ Never commit `.env` files
- ✅ Rotate secrets regularly
- ✅ Enable Google Cloud API usage limits
- ✅ Monitor OAuth quota usage
- ✅ Implement rate limiting on API endpoints

---

## 📊 Step 9: Monitoring

### 9.1 Check Sync Logs

Create a simple dashboard query:
```sql
-- Sync success rate
SELECT 
  sync_status,
  COUNT(*) as count,
  AVG(items_synced) as avg_items
FROM integration_sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY sync_status;
```

### 9.2 Monitor Active Integrations

```sql
SELECT 
  COUNT(*) as active_users,
  MAX(last_synced) as most_recent_sync,
  MIN(last_synced) as oldest_sync
FROM user_integrations
WHERE platform = 'google_classroom' AND is_active = true;
```

---

## 🎓 Step 10: User Guide

### For Students:

**How to Connect Google Classroom:**
1. Login to Acadence
2. Click "Connected Apps" in sidebar
3. Click "Connect Now" on Google Classroom
4. Authorize Acadence to access your Google Classroom
5. Done! Your courses and assignments will sync automatically

**Features:**
- 📚 View all your Google Classroom courses
- 📝 See assignments with due dates
- ⏰ Get reminders for upcoming deadlines
- 🔄 Auto-sync every 3 hours
- 📊 Unified dashboard with all your academic data

---

## 🛠️ Troubleshooting

### Backend Logs
```bash
# Check if sync service started
grep "auto-sync service" backend-logs.txt

# Check for sync errors
grep "ERROR" backend-logs.txt | grep "google"
```

### Database Health Check
```sql
-- Check for failed syncs
SELECT * FROM integration_sync_logs 
WHERE sync_status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📞 Support

If you encounter issues:
1. Check logs in `integration_sync_logs` table
2. Verify Google Cloud Console settings
3. Check network connectivity
4. Ensure Google Classroom API is enabled
5. Verify OAuth credentials are correct

---

## ✅ Success Checklist

- [ ] Google Cloud project created
- [ ] Google Classroom API enabled
- [ ] OAuth credentials created
- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Backend server running
- [ ] Frontend accessible
- [ ] OAuth flow working
- [ ] Data syncing successfully
- [ ] Auto-sync service running

---

## 🎉 You're All Set!

Your Acadence platform now has Google Classroom integration! Students can connect their accounts and see all their academic data in one place.

**Next Steps:**
- Add more integrations (GitHub, Zoom, Notion)
- Implement AI insights using synced data
- Create unified assignment view
- Add push notifications for new assignments

Happy coding! 🚀
