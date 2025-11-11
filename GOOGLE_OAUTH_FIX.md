# 🔧 GOOGLE OAUTH CONFIGURATION - EXACT SETUP

## ⚠️ IMPORTANT: There are TWO different sections!

---

## 1️⃣ Authorized JavaScript origins
**Location:** Scroll down in the OAuth client configuration

**What to add (NO PATHS - just base URLs):**
```
http://localhost:5173
http://localhost:5000
```

**For production, add:**
```
https://your-domain.com
```

---

## 2️⃣ Authorized redirect URIs  
**Location:** Above the JavaScript origins section

**What to add (WITH FULL CALLBACK PATH):**
```
http://localhost:5000/api/integrations/google-classroom/callback
```

**For production, add:**
```
https://your-domain.com/api/integrations/google-classroom/callback
```

---

## 📋 Step-by-Step Instructions:

### Step 1: In Google Cloud Console
- Go to "APIs & Services" > "Credentials"
- Click on your OAuth 2.0 Client ID (or create new)

### Step 2: Find "Authorized redirect URIs" section (usually at the top)
- Click "+ ADD URI"
- Paste: `http://localhost:5000/api/integrations/google-classroom/callback`
- Press Enter or click outside
- ✅ This should NOT show an error

### Step 3: Scroll down to "Authorized JavaScript origins"
- Click "+ ADD URI"  
- Paste: `http://localhost:5173` (frontend URL)
- Click "+ ADD URI" again
- Paste: `http://localhost:5000` (backend URL)
- ✅ These should NOT show errors (no paths allowed here)

### Step 4: Click "SAVE" at the bottom

---

## 🎯 Expected Result:

### Authorized redirect URIs:
✅ `http://localhost:5000/api/integrations/google-classroom/callback`

### Authorized JavaScript origins:
✅ `http://localhost:5173`
✅ `http://localhost:5000`

---

## ❌ Common Mistakes:

### WRONG - Adding callback URL to JavaScript origins:
```
❌ http://localhost:5000/api/integrations/google-classroom/callback
```
**Error:** "URIs must not contain a path or end with '/'"

### CORRECT - JavaScript origins should be base URLs only:
```
✅ http://localhost:5000
✅ http://localhost:5173
```

### CORRECT - Redirect URIs should have the full path:
```
✅ http://localhost:5000/api/integrations/google-classroom/callback
```

---

## 🔍 Visual Guide:

```
┌─────────────────────────────────────────┐
│  OAuth Client Configuration             │
├─────────────────────────────────────────┤
│                                         │
│  Name: Acadence Web Client              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Authorized redirect URIs          │ │ ← ADD CALLBACK HERE
│  ├───────────────────────────────────┤ │
│  │ + ADD URI                         │ │
│  │                                   │ │
│  │ URIs 1 *                          │ │
│  │ http://localhost:5000/api/...    │ │ ✅ FULL PATH
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Authorized JavaScript origins     │ │ ← ADD BASE URLS HERE
│  ├───────────────────────────────────┤ │
│  │ + ADD URI                         │ │
│  │                                   │ │
│  │ URIs 1 *                          │ │
│  │ http://localhost:5173             │ │ ✅ NO PATH
│  │                                   │ │
│  │ URIs 2 *                          │ │
│  │ http://localhost:5000             │ │ ✅ NO PATH
│  └───────────────────────────────────┘ │
│                                         │
│  [SAVE]  [CANCEL]                      │
└─────────────────────────────────────────┘
```

---

## ✅ Summary:

| Section | What to Add | Example |
|---------|-------------|---------|
| **Authorized redirect URIs** | Full callback path | `http://localhost:5000/api/integrations/google-classroom/callback` |
| **Authorized JavaScript origins** | Base URL only (frontend) | `http://localhost:5173` |
| **Authorized JavaScript origins** | Base URL only (backend) | `http://localhost:5000` |

---

**Once you add these correctly, click SAVE and you're done! 🎉**
