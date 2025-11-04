# 🚀 Setup Acadence Gmail Account for Sending Emails

## Step 1: Create Professional Gmail Account

### Create New Gmail:
1. **Go to:** https://accounts.google.com/signup
2. **Fill in details:**
   - **Name:** Acadence LMS (or "Acadence Attendance Team")
   - **Username:** Try these (check availability):
     - `acadence.lms@gmail.com` ⭐
     - `acadence.attendance@gmail.com`
     - `acadence.alerts@gmail.com`
     - `acadenceedu@gmail.com`
     - `myacadence@gmail.com`
   - **Password:** Create a strong password (save it!)
   
3. **Complete signup:**
   - Add phone number (required)
   - Verify phone
   - Skip recovery email (optional)
   - Accept terms

4. **Note down:**
   - ✅ Email: `acadence.lms@gmail.com` (or whatever you chose)
   - ✅ Password: [your password]

---

## Step 2: Enable 2-Step Verification

### Required for App Passwords:

1. **Go to:** https://myaccount.google.com/security
2. **Find "2-Step Verification"**
3. **Click "Get started"**
4. **Follow prompts:**
   - Verify your phone number
   - Choose method: Text message or phone call
   - Get verification code
   - Enter code
   - Click "Turn on"

✅ **2-Step Verification is now enabled!**

---

## Step 3: Generate App Password

### This allows the app to send emails:

1. **Go to:** https://myaccount.google.com/apppasswords
   - (You must be logged in to the Acadence Gmail account)

2. **Create App Password:**
   - App: Select "Mail"
   - Device: Select "Other (Custom name)"
   - Name: Enter "Acadence LMS Server"
   - Click "Generate"

3. **Copy the 16-character password:**
   ```
   Example: abcd efgh ijkl mnop
   ```
   
4. **IMPORTANT:** 
   - ✅ Save this password (you won't see it again!)
   - ✅ Copy it without spaces: `abcdefghijklmnop`

---

## Step 4: Update Your .env File

### Open the file:
`C:\Users\HP\OneDrive\Desktop\Acadence_09\backend\.env`

### Add/Update these lines:

```env
# Email Configuration - Gmail Account
EMAIL_SERVICE=gmail
GMAIL_USER=acadence.lms@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=Acadence LMS
```

**Replace:**
- `acadence.lms@gmail.com` → Your actual Gmail address from Step 1
- `abcdefghijklmnop` → Your App Password from Step 3 (no spaces!)

---

## Step 5: Test Email Sending

### Run the email script:

```powershell
cd C:\Users\HP\OneDrive\Desktop\Acadence_09\backend
node sendAttendanceEmails.js
```

### Expected Output:
```
🚀 Starting attendance email campaign...
📧 Target: Students with <75% attendance in any subject

📊 Found 10 total students

📧 Processing: Yashvi Aggarwal (yashvi0078.becse24@chitkara.edu.in)
   ⚠️ 1 subject(s) below 75%:
      - OOPS: 71.4% (10/14)
✅ Email sent via Gmail to yashvi0078.becse24@chitkara.edu.in
   Message ID: <abc123@gmail.com>

📧 Processing: Yana Sobti (yana0075.becse24@chitkara.edu.in)
   ⚠️ 1 subject(s) below 75%:
      - OOPS: 64.3% (9/14)
✅ Email sent via Gmail to yana0075.becse24@chitkara.edu.in
   Message ID: <xyz789@gmail.com>

...

✅ Email campaign completed!
📧 Emails sent: 3
⏭️ Students skipped: 7
📊 Total processed: 10
```

---

## Step 6: Verify Students Received Emails

### Students should receive email like this:

**From:** Acadence LMS <acadence.lms@gmail.com>
**Subject:** ⚠️ Urgent: Your OOPS Attendance is Below 75%
**Content:**
- Personalized greeting
- Attendance breakdown with progress bars
- Motivational message
- Action items (attend next X classes)

### Ask students to check:
1. ✅ Inbox
2. ✅ Spam folder (if not in inbox)

---

## 📧 How Emails Will Look

### Email Header:
```
From: Acadence LMS <acadence.lms@gmail.com>
To: yana0075.becse24@chitkara.edu.in
Subject: ⚠️ Urgent: Your OOPS Attendance is Below 75%
```

### Email Body Preview:
```
Hi Yana Sobti,

Your attendance in OOPS needs immediate attention! You're 
currently at 64.3% and need to attend the next 3 classes 
without fail to reach the 75% requirement.

📚 Your Attendance Breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subject: OOPS
Classes: 9/14
Percentage: 64.3%
Status: Critical ⚠️
Action: Attend next 3 classes

Remember: You need 75% attendance to be eligible for exams!
```

---

## ✅ Configuration Summary

After setup, your `.env` should have:

```env
# Supabase
SUPABASE_URL=https://ujcxhvqxcfxuwjxffotc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=wcjRNL6sRGsO2DZ4dTggLEw==
PORT=5000

# Frontend
FRONTEND_URL=http://localhost:5173

# Email - Gmail Account
EMAIL_SERVICE=gmail
GMAIL_USER=acadence.lms@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password-here
EMAIL_FROM_NAME=Acadence LMS
```

---

## 🎯 Benefits of This Setup

✅ **Free** - Gmail allows 500 emails/day (more than enough)
✅ **Professional** - Dedicated email for Acadence
✅ **Reliable** - Gmail has excellent deliverability
✅ **Immediate** - Works right away (no domain verification)
✅ **Easy** - No DNS records or domain purchase needed
✅ **Monitored** - You can check sent emails in Gmail account

---

## 📊 Weekly Schedule

Your system is already configured to automatically send emails:
- **When:** Every Monday at 8:00 AM IST
- **Who:** Students with <75% attendance in any subject
- **What:** Personalized attendance alerts with action items

---

## 🔄 Manual Trigger (Anytime)

To send emails manually (not wait for Monday):

```powershell
cd C:\Users\HP\OneDrive\Desktop\Acadence_09\backend
node sendAttendanceEmails.js
```

Or via API (when server is running):
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/notifications/test-weekly-email"
```

---

## 🆘 Troubleshooting

### "Invalid credentials" error:
- ✅ Make sure 2-Step Verification is enabled
- ✅ Use App Password (not regular Gmail password)
- ✅ Remove spaces from App Password

### Emails going to spam:
- ✅ Ask students to mark as "Not Spam"
- ✅ Add acadence.lms@gmail.com to contacts
- ✅ After 2-3 emails, Gmail learns it's legitimate

### Not receiving emails:
- ✅ Check spam folder
- ✅ Verify student email addresses in database
- ✅ Check Acadence Gmail "Sent" folder to confirm

---

## 📋 Quick Checklist

Setup steps:
- [ ] Create Gmail account (acadence.lms@gmail.com)
- [ ] Enable 2-Step Verification
- [ ] Generate App Password
- [ ] Update `.env` file with credentials
- [ ] Test with `node sendAttendanceEmails.js`
- [ ] Verify students received emails
- [ ] Check spam folders if needed

---

## 🚀 Ready to Start?

**Current step:** Create the Gmail account!

1. Go to: https://accounts.google.com/signup
2. Create account with name "Acadence LMS"
3. Try username: `acadence.lms@gmail.com`
4. Complete signup
5. Come back and tell me: "Account created!"

I'll help you with the next steps! 📧✨
