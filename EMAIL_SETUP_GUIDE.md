# 📧 Quick Email Setup Guide

## ⚡ 5-Minute Setup for Gmail

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Scroll to "2-Step Verification"
3. Click "Get Started" and follow the setup

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" from dropdown
3. Select "Other (Custom name)"
4. Type "Acadence LMS"
5. Click "Generate"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Your .env File
1. Open `backend/.env`
2. Add these lines:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=abcdefghijklmnop
FRONTEND_URL=http://localhost:5173
```
(Replace with your actual email and the app password from Step 2 - remove spaces!)

### Step 4: Restart Backend
```bash
cd backend
npm start
```

### Step 5: Verify
Look for this message in terminal:
```
✅ Email server is ready to send messages
```

## ✅ You're Done!
Now when students have critical attendance, they'll receive beautiful email alerts!

---

## 🔧 Alternative: Outlook Setup

1. Update `backend/.env`:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your.email@outlook.com
EMAIL_PASS=your_outlook_password
FRONTEND_URL=http://localhost:5173
```

2. Restart backend server

---

## 🧪 Test Your Email Setup

### Method 1: Trigger a notification
1. Login as a student
2. Click the 🔔 bell icon
3. Click "Generate AI Alerts"
4. Check your email inbox!

### Method 2: Check backend logs
After restarting, you should see:
```
✅ Email server is ready to send messages
```

If you see:
```
⚠️ Email not configured
```
Double-check your .env file has EMAIL_USER and EMAIL_PASS

---

## 📨 Sample Email Preview

**Subject:** 🚨 URGENT: DSOOPS Attendance Alert - Action Required

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Acadence LMS
Attendance Alert Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 Hello John!

⚠️ URGENT: Your DSOOPS attendance is at 70%! 
You've missed 6 out of 20 classes. Attend the 
next DSOOPS class or risk detention. This is 
critical! 🚨

Subject: DSOOPS
Attendance: 70%

[Progress Bar: ███████░░░░░░░░░ 70%]
❌ Below Required 75%

Attendance Details:
• Subject: Data Structures using OOP
• Classes Attended: 14 / 20
• Classes Missed: 6
• Current Percentage: 70%

⚠️ DETENTION RISK
Your attendance is below the required 75% 
threshold. Please attend all upcoming classes 
to avoid academic consequences.

[View Full Attendance Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Acadence Learning Management System
This is an automated notification.
© 2025 Acadence. All rights reserved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎨 Email Features

✅ Beautiful HTML design with gradients
✅ Progress bars showing attendance %
✅ Color-coded alerts (red/orange/yellow/green)
✅ Mobile-responsive layout
✅ Direct link to student dashboard
✅ Plain text fallback for email clients
✅ High-priority for critical alerts

---

## 🆘 Troubleshooting

### "Invalid credentials" error
- Make sure you're using the **App Password**, not your regular Gmail password
- Remove any spaces from the password in .env

### "Connection timeout"
- Check your internet connection
- Some networks block SMTP ports - try a different network
- Verify EMAIL_SERVICE is set to 'gmail' or 'outlook'

### Emails going to spam
- Add sender email to contacts
- Check spam folder
- Wait a few minutes (sometimes delayed)

### Still not working?
1. Check .env file exists in backend folder
2. Restart terminal and backend server
3. Check backend logs for errors
4. Verify student email addresses in database

---

## 📚 More Help
See full documentation in `NOTIFICATION_SYSTEM_GUIDE.md`
