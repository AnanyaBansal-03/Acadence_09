# 🤖 OpenAI Weekly Attendance Notifications Setup Guide

## Overview
Automated weekly AI-powered email notifications that tell students which classes to attend to maintain 75% attendance.

## Features
- ✅ Runs every Monday at 8:00 AM automatically
- ✅ Uses OpenAI GPT-4o-mini to generate personalized messages
- ✅ Identifies students with attendance below 80% (buffer above 75%)
- ✅ Shows exactly which classes to attend this week
- ✅ Calculates how many classes needed to reach 75%
- ✅ Beautiful HTML email templates
- ✅ Manual trigger option for testing

---

## 📋 Prerequisites

1. **OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Sign up / Log in
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Brevo Email** (Already configured ✅)
   - Your Brevo SMTP is already set up from previous configuration

---

## 🛠️ Setup Steps

### Step 1: Add OpenAI API Key to .env

Open `backend/.env` and replace the placeholder:

```env
# Find this line:
OPENAI_API_KEY=your_openai_api_key_here

# Replace with your actual key:
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### Step 2: Restart Backend Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
cd C:\Users\HP\OneDrive\Desktop\Acadence_09\backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
📅 Initializing weekly attendance notification scheduler...
✅ Weekly attendance scheduler initialized
📅 Will run every Monday at 8:00 AM IST
💡 Use POST /api/notifications/send-weekly to trigger manually
```

### Step 3: Test the System (Manual Trigger)

Use Postman or Thunder Client:

**Endpoint:** `POST http://localhost:5000/api/notifications/send-weekly`

**Headers:**
```
Authorization: Bearer <your-student-or-admin-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Weekly attendance notifications sent successfully"
}
```

---

## 📧 What Students Will Receive

### Email Subject Examples:
- 🚨 **URGENT:** Attendance Alert - 2 Subjects Below 75%
- ⚠️ **Weekly Attendance Reminder** - Stay on Track!
- 📊 **Your Weekly Attendance Update**

### Email Content:
1. **Personalized AI Message** - Friendly, motivating advice from GPT
2. **Subject Breakdown** - Each subject with:
   - Current attendance percentage
   - Classes attended/total
   - How many more classes needed to reach 75%
   - Upcoming classes this week (day & time)
3. **Visual Progress Bars** - Color-coded by severity
4. **Action Plan** - Specific days/times to attend

### Example AI Message:
```
Hi Yashvi!

I noticed your attendance in DSOOPS and DBMS needs attention this week. 
Your DSOOPS attendance is at 68.5%, which is below the 75% threshold. 

Here's your action plan:
- Attend DSOOPS classes on Monday at 11:00 and Wednesday at 15:00
- Don't miss any DBMS classes this week to stay above 75%

Each class counts! You're only 3 classes away from being back on track.
```

---

## ⚙️ How It Works

### Automatic Schedule
- **Runs:** Every Monday at 8:00 AM IST
- **Process:**
  1. Fetch all students from database
  2. Calculate attendance for each subject
  3. Filter students with subjects below 80%
  4. Generate AI-personalized message for each student
  5. Send email with upcoming class schedule
  6. Skip students with all subjects above 80%

### Manual Testing
```bash
# Using curl (PowerShell)
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:5000/api/notifications/send-weekly" `
    -Method POST -Headers $headers
```

### Check Console Logs
```
🔄 Starting weekly attendance notification job...
📊 Processing 15 students...
✅ Sent email to yashvi@chitkara.edu.in
✅ Sent email to aditi@chitkara.edu.in
⏭️ aryan@chitkara.edu.in: All subjects above 80% - skipping email
✅ Weekly notification job completed!
📧 Emails sent: 9
⏭️ Emails skipped: 6
```

---

## 🎯 Customization Options

### Change Schedule Time
Edit `backend/services/weeklyScheduler.js`:

```javascript
// Current: Every Monday at 8:00 AM
cron.schedule('0 8 * * 1', () => { ... })

// Examples:
// Every day at 9 AM:        cron.schedule('0 9 * * *', ...)
// Every Sunday at 10 AM:     cron.schedule('0 10 * * 0', ...)
// Twice a week (Mon, Thu):   cron.schedule('0 8 * * 1,4', ...)
```

### Adjust Attendance Threshold
Edit `backend/services/weeklyScheduler.js`:

```javascript
// Current: Sends if attendance < 80%
const subjectsNeedingAttention = subjects.filter(s => s.attendance_percentage < 80);

// Change to 85%:
const subjectsNeedingAttention = subjects.filter(s => s.attendance_percentage < 85);
```

### Change AI Model
Edit `backend/services/openaiService.js`:

```javascript
// Current: gpt-4o-mini (cost-effective)
model: "gpt-4o-mini"

// More advanced (higher cost):
model: "gpt-4o"
model: "gpt-4-turbo"
```

---

## 💰 Cost Estimation

**OpenAI Pricing (as of 2024):**
- GPT-4o-mini: ~$0.15 per 1M tokens
- Average message: ~500 tokens (input) + 300 tokens (output) = 800 tokens
- Cost per email: ~$0.0001 (0.01 cents)

**For 100 students:**
- Weekly cost: ~$0.01
- Monthly cost: ~$0.04
- Annual cost: ~$0.50

**Brevo Email:**
- Free tier: 300 emails/day
- More than enough for weekly notifications

---

## 🧪 Testing Checklist

- [ ] Added `OPENAI_API_KEY` to `.env`
- [ ] Restarted backend server
- [ ] Saw scheduler initialization message in console
- [ ] Triggered manual send: `POST /api/notifications/send-weekly`
- [ ] Checked student email inbox
- [ ] Verified email contains:
  - [ ] Personalized AI message
  - [ ] Subject attendance breakdown
  - [ ] Upcoming class schedule
  - [ ] Progress bars and badges
  - [ ] "View Dashboard" button works

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not found"
- Check `.env` file has the key
- Restart server after adding key
- Verify no spaces around `=` sign

### No emails received
- Check Brevo sending limits (300/day free)
- Verify student email is correct in database
- Check server console for error messages
- Look in spam folder

### AI message generation fails
- Check OpenAI API key is valid
- Verify internet connection
- Falls back to template message if OpenAI fails
- Check console for "OpenAI API Error"

### Emails sent to wrong students
- Only sends to students with attendance < 80%
- Students with all subjects > 80% are skipped
- Check console logs: "All subjects above 80% - skipping"

---

## 📊 Database Requirements

The scheduler uses existing tables:
- ✅ `users` (student name, email)
- ✅ `enrollments` (which classes students are in)
- ✅ `classes` (class schedule, subject info)
- ✅ `attendance` (attendance records)

No new tables needed!

---

## 🎓 Example Use Case

**Monday 8:00 AM:**
1. System wakes up
2. Finds Yashvi has DSOOPS at 68.5% (below 80%)
3. Identifies upcoming DSOOPS classes: Mon 11:00, Wed 15:00, Fri 09:00
4. Asks OpenAI to write a personalized message
5. Sends beautiful HTML email to yashvi@chitkara.edu.in
6. Yashvi receives email, attends classes, reaches 75%!

---

## 🔒 Security Notes

- ✅ Keep `OPENAI_API_KEY` secret (never commit to Git)
- ✅ Already in `.gitignore`
- ✅ Use environment variables only
- ✅ Token-based authentication for manual trigger endpoint

---

## 📞 Support

If you encounter issues:
1. Check console logs for errors
2. Verify `.env` configuration
3. Test with manual trigger first
4. Check email spam folder
5. Verify OpenAI API key has credits

---

**Ready to go! 🚀**

Once you add your OpenAI API key and restart the server, the system will automatically send personalized weekly attendance emails every Monday at 8:00 AM.
