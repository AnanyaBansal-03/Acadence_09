# 🚀 Google Classroom Integration Setup Checklist

## ✅ Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
- Go to https://console.cloud.google.com/
- Create a new project or select existing one
- Project name suggestion: "Acadence Integration"

### 1.2 Enable Required APIs
Go to "APIs & Services" > "Library" and enable:
- ✅ **Google Classroom API**
- ✅ **People API** (for user profile info)

### 1.3 Configure OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" (for testing) or "Internal" (for organization)
- Fill in required fields:
  - App name: Acadence
  - User support email: your-email@example.com
  - Developer contact: your-email@example.com
- Add scopes:
  - `.../auth/classroom.courses.readonly`
  - `.../auth/classroom.coursework.me.readonly`
  - `.../auth/classroom.announcements.readonly`
  - `.../auth/classroom.rosters.readonly`
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`

### 1.4 Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- Application type: **Web application**
- Name: "Acadence Web Client"

**⚠️ IMPORTANT: Add Authorized redirect URIs (NO trailing slash):**

For Development:
```
http://localhost:5000/api/integrations/google-classroom/callback
```

For Production (replace with your domain):
```
https://your-domain.com/api/integrations/google-classroom/callback
```

- Click "Create"
- **Copy the Client ID and Client Secret** (you'll need them next)

---

## ✅ Step 2: Backend Configuration

### 2.1 Add Environment Variables
Add these to your `backend/.env` file:

```bash
# Google Classroom Integration
GOOGLE_CLIENT_ID=your-actual-client-id-from-google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-classroom/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2.2 Check Backend Port
Verify your backend server runs on port 5000. Check `backend/server.js`:
```javascript
const PORT = process.env.PORT || 5000;
```

---

## ✅ Step 3: Database Setup

### 3.1 Run Database Migrations
Execute the SQL script to create integration tables:

```bash
# Using Supabase SQL Editor:
# Go to your Supabase project > SQL Editor
# Copy and paste the content from: backend/scripts/createIntegrationsTables.sql
```

Or if using PostgreSQL directly:
```bash
psql your_database < backend/scripts/createIntegrationsTables.sql
```

### 3.2 Verify Tables Created
Check that these tables exist:
- `user_integrations`
- `external_assignments`
- `external_courses`
- `integration_sync_logs`

---

## ✅ Step 4: Start the Application

### 4.1 Start Backend
```bash
cd backend
npm install
node server.js
```

Verify server is running on: http://localhost:5000

### 4.2 Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Verify frontend is running on: http://localhost:5173

---

## ✅ Step 5: Test the Integration

### 5.1 Login to Acadence
- Login as a student user
- Navigate to Dashboard

### 5.2 Connect Google Classroom
- Click on "Integrations" or "Connected Apps"
- Find "Google Classroom" card
- Click "Connect Now"
- Authorize with your Google account
- Grant permissions to access Google Classroom

### 5.3 Sync Data
- After connection, click "Sync Now"
- Wait for sync to complete
- Verify courses and assignments appear

---

## 🔍 Troubleshooting

### Issue: "Redirect URI mismatch"
**Solution:** Make sure the redirect URI in Google Cloud Console exactly matches:
```
http://localhost:5000/api/integrations/google-classroom/callback
```
(NO trailing slash, correct port)

### Issue: "Access denied" or "Invalid scope"
**Solution:** 
1. Go to OAuth consent screen
2. Add all required scopes
3. If in "Testing" mode, add your Google account to test users

### Issue: "Failed to fetch courses"
**Solution:**
1. Check if Google Classroom API is enabled
2. Verify the access token in database
3. Check backend logs for detailed error

### Issue: Backend not starting
**Solution:**
1. Check if all npm packages are installed
2. Verify .env file has all required variables
3. Check if port 5000 is not already in use

---

## 📝 Testing Account Requirements

To test Google Classroom integration, you need:
- ✅ A Google account
- ✅ At least one Google Classroom course (as student or teacher)
- ✅ Some assignments in that course (for testing sync)

If you don't have a Google Classroom:
1. Create a test course at https://classroom.google.com
2. Add some sample assignments
3. Then test the integration

---

## 🎯 Expected Results

After successful setup:
1. ✅ You can connect Google Classroom
2. ✅ Courses appear in the integration panel
3. ✅ Assignments sync with due dates
4. ✅ Data refreshes on manual sync
5. ✅ Stats show course and assignment counts

---

## 🔐 Security Notes

- ✅ Access tokens are stored encrypted in database
- ✅ Refresh tokens allow automatic token renewal
- ✅ OAuth 2.0 ensures secure authorization
- ✅ No passwords are stored
- ✅ Users can disconnect anytime

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check backend terminal for logs
3. Verify all environment variables are set
4. Ensure database tables are created
5. Test with a simple Google Classroom course first

---

**🎉 Once everything works, you'll have a fully functional Google Classroom integration in Acadence!**
