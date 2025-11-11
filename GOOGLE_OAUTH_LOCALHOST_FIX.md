# 🔧 GOOGLE OAUTH LOCALHOST FIX

## ⚠️ Error: "domains of your redirect URIs or JavaScript origins does not comply with Google's requirements"

This happens when Google blocks localhost in certain configurations.

---

## ✅ SOLUTION 1: Use 127.0.0.1 instead of localhost

Replace `localhost` with `127.0.0.1`:

### Authorized JavaScript origins:
```
http://127.0.0.1:5000
http://127.0.0.1:5173
```

### Authorized redirect URIs:
```
http://127.0.0.1:5000/api/integrations/google-classroom/callback
```

---

## ✅ SOLUTION 2: Check OAuth Consent Screen Configuration

Before creating credentials, make sure:

### Step 1: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose **"External"** (if testing) or **"Internal"** (if you have workspace)
3. Fill in required fields:
   - **App name:** Acadence
   - **User support email:** Your email
   - **Developer contact information:** Your email
4. Click "SAVE AND CONTINUE"

### Step 2: Add Scopes
1. Click "ADD OR REMOVE SCOPES"
2. Filter and add these scopes:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
   - `https://www.googleapis.com/auth/classroom.announcements.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click "UPDATE"
4. Click "SAVE AND CONTINUE"

### Step 3: Add Test Users (if using External)
1. Click "ADD USERS"
2. Add your Google email address
3. Click "SAVE AND CONTINUE"

### Step 4: Summary
Review and click "BACK TO DASHBOARD"

---

## ✅ SOLUTION 3: Try Creating Credentials Again

Now try creating OAuth client ID again with these exact values:

### For Authorized redirect URIs:
```
http://127.0.0.1:5000/api/integrations/google-classroom/callback
```

### For Authorized JavaScript origins:
```
http://127.0.0.1:5173
http://127.0.0.1:5000
```

---

## ✅ SOLUTION 4: Alternative - Use existing OAuth Client

If you already have an OAuth client created for another purpose:
1. Go to "Credentials"
2. Edit existing "Web client" 
3. Add the URIs there

---

## 🔄 After Successful Creation:

### Update your backend/.env file:

Replace all `localhost` with `127.0.0.1`:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:5000/api/integrations/google-classroom/callback

# Frontend URL
FRONTEND_URL=http://127.0.0.1:5173
```

### Update frontend code (if needed):

When connecting, open browser at `http://127.0.0.1:5173` instead of `localhost:5173`

---

## 🎯 Step-by-Step Fresh Start:

1. **Delete any failed OAuth client** (if created)
2. **Complete OAuth Consent Screen** setup first
3. **Enable APIs:**
   - Google Classroom API
   - People API
4. **Create new OAuth Client ID** with `127.0.0.1` URIs
5. **Copy credentials** to .env file
6. **Test the integration**

---

## 📞 Still Having Issues?

### Check these:
- ✅ OAuth Consent Screen is fully configured
- ✅ Using "External" user type (or "Internal" for workspace)
- ✅ Test users added (if External)
- ✅ All required APIs are enabled
- ✅ Using `127.0.0.1` instead of `localhost`
- ✅ No trailing slashes in URIs
- ✅ Port numbers are included (`:5000`, `:5173`)

### Tracking Number: c8948498190528341
Save this for Google support if needed.

---

## ✨ Try This Right Now:

1. Use `127.0.0.1` instead of `localhost`
2. Make sure OAuth Consent Screen is completed
3. Try creating the client again

This should work! 🚀
