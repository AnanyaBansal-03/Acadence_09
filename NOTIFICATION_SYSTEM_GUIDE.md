# AI-Powered Attendance Notification System

## 🎯 Overview

This system provides **personalized, AI-generated notifications** to students about their attendance status. Messages vary from strict warnings for low attendance (<75%) to encouraging messages for excellent attendance (>95%).

## ✨ Features

### 1. **Smart Attendance Tracking**
- Calculates attendance percentage per subject
- Groups all class sessions by subject code
- Tracks across all enrolled subjects

### 2. **AI-Powered Personalized Messages**
- **Critical (<75%)**: Strict warnings about detention risk
  - Example: *"⚠️ URGENT: Your DSOOPS attendance is at 70%! Attend the next class or risk detention. This is critical! 🚨"*
  
- **Warning (75-85%)**: Encouraging but cautionary
  - Example: *"⚠️ Hey Student, your FEE attendance is at 78%. You're at risk! Try to attend all upcoming classes. You can do it! 💪"*
  
- **Good (85-95%)**: Positive reinforcement
  - Example: *"✅ Good job! Your DBMS attendance is at 88%. You're doing well, keep it up! 👍"*
  
- **Excellent (>95%)**: Lenient, congratulatory
  - Example: *"🌟 AMAZING! Your OOSE attendance is 98% - absolutely stellar! You're risk-free. Feel free to take a breather! 🎉"*

### 3. **Smart Notification System**
- **Automatic Generation**: Notifications auto-generate when attendance is marked
- **Manual Refresh**: Students can click "Generate AI Alerts" anytime
- **Duplicate Prevention**: Won't spam - only one notification per subject per 24 hours
- **Priority-based**: Only sends critical/warning notifications automatically

### 4. **Interactive UI**
- 🔔 Notification bell with unread count badge
- Color-coded by severity (red, orange, yellow, green)
- Subject badges showing attendance percentage
- Mark as read/unread functionality
- Delete notifications
- Timestamp with relative time (e.g., "5m ago", "2h ago")

### 5. **📧 Email Notifications** ✨ NEW
- **Automatic email alerts** for critical (<75%) and warning (75-85%) attendance
- **Beautiful HTML emails** with progress bars and attendance stats
- **Multiple provider support**: Gmail, Outlook, Custom SMTP
- **Smart delivery**: Only sends for critical/warning to avoid spam
- **Personalized subject lines**: "🚨 URGENT: DSOOPS Attendance Alert"
- **Mobile-responsive design** with color-coded alerts

## 📁 File Structure

```
backend/
├── services/
│   ├── notificationService.js       # AI message generation & attendance calculation
│   └── emailService.js              # 📧 Email sending with HTML templates
├── routes/
│   ├── notifications.js             # Notification API endpoints
│   └── student.js                   # Auto-trigger on attendance marking
├── scripts/
│   ├── createNotifications.sql      # Database table creation
│   └── setupNotifications.sql       # Quick setup script
├── .env.example                     # Environment variables template
└── server.js                        # Route registration

frontend/
└── src/
    └── components/
        └── student/
            ├── StudentNotifications.jsx  # Notification component
            └── StudentNavbar.jsx         # Integration in navbar
```

## 🚀 Setup Instructions

### 1. Database Setup
Run the SQL script to create the notifications table:

```bash
# Connect to your Supabase/PostgreSQL database and run:
psql -h <host> -U <user> -d <database> -f backend/scripts/createNotifications.sql
```

Or execute in Supabase SQL Editor:
```sql
-- Copy contents of backend/scripts/setupNotifications.sql
```

### 2. Backend Setup
The backend is already configured! Routes are registered in `server.js`:
```javascript
app.use("/api/notifications", notificationRoutes);
```

### 3. 📧 Email Setup (CRITICAL for Email Notifications)

#### Option A: Gmail Setup (Recommended)

1. **Enable 2-Step Verification** on your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "Acadence LMS"
   - Copy the 16-character password

3. **Update `.env` file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_app_password_here  # 16-char password from step 2
FRONTEND_URL=http://localhost:5173
```

#### Option B: Outlook/Hotmail Setup

1. Update `.env` file:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your.email@outlook.com
EMAIL_PASS=your_outlook_password
FRONTEND_URL=http://localhost:5173
```

#### Option C: Custom SMTP Server

1. Update `.env` file:
```env
EMAIL_SERVICE=custom
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_smtp_password
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
FRONTEND_URL=https://yourdomain.com
```

### 4. Test Email Configuration

After setting up, restart your backend and check logs:
```bash
cd backend
npm start
```

You should see:
```
✅ Email server is ready to send messages
```

If you see a warning instead:
```
⚠️ Email not configured. Add EMAIL_USER and EMAIL_PASS to .env file
```
This means emails are disabled (system still works, just no emails sent).

### 3. Frontend Integration
The notification component is integrated in `StudentNavbar.jsx` and will appear automatically.

### 4. (Optional) OpenAI Integration
To use real AI-generated messages instead of templates:

1. Install OpenAI package:
```bash
cd backend
npm install openai
```

2. Add API key to `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. Uncomment the `generateAIMessageWithAPI` function in `backend/services/notificationService.js`

4. Update the notification generation to use it:
```javascript
// Replace generateAIMessage with generateAIMessageWithAPI
const message = await generateAIMessageWithAPI({...});
```

## � Email Notification Features

### What Gets Sent
- **Critical (<75%)**: High-priority email with red alert styling
  - Subject: "🚨 URGENT: [Subject] Attendance Alert - Action Required"
  - Includes detention warning
  
- **Warning (75-85%)**: Standard email with orange warning styling
  - Subject: "⚠️ [Subject] Attendance Warning"
  - Encouraging tone to improve

- **Good & Excellent (>85%)**: No automatic emails (reduces spam)
  - Only sent when manually generating notifications
  - Subject: "✅ [Subject] Attendance Update" or "🌟 Great Job!"

### Email Content Includes
- 📊 Attendance progress bar
- 📈 Detailed statistics (attended/missed classes)
- 🎯 Current percentage and threshold status
- 💌 Personalized AI-generated message
- 🔗 Link to student dashboard
- 📱 Mobile-responsive HTML design

### When Emails Are Sent
1. **Automatic**: After student marks attendance via QR code
   - Only for critical/warning cases
   - Background process (doesn't slow down app)
   
2. **Manual**: When student clicks "Generate AI Alerts"
   - Sends for ALL notification types
   - Batch processing with rate limiting

### Email Delivery
- ✅ Sent asynchronously (non-blocking)
- ✅ Duplicate prevention (24-hour window)
- ✅ Error handling (falls back gracefully)
- ✅ Beautiful HTML with plain text fallback
- ✅ High priority for critical alerts

## �📡 API Endpoints

### GET `/api/notifications`
Fetch all notifications for logged-in student
- **Auth**: Required (Bearer token)
- **Response**: 
  ```json
  {
    "success": true,
    "notifications": [...],
    "unreadCount": 3
  }
  ```

### POST `/api/notifications/generate`
Manually trigger notification generation + email sending
- **Auth**: Required
- **Side Effect**: Sends emails for critical/warning cases
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Generated 2 new notifications",
    "notifications": [...],
    "stats": [...]
  }
  ```

### PATCH `/api/notifications/:id/read`
Mark a notification as read
- **Auth**: Required
- **Params**: `id` - notification ID

### PATCH `/api/notifications/mark-all-read`
Mark all notifications as read
- **Auth**: Required

### DELETE `/api/notifications/:id`
Delete a notification
- **Auth**: Required
- **Params**: `id` - notification ID

## 🔧 How It Works

### Automatic Flow
1. Student scans QR code → Attendance marked
2. Backend triggers `generateNotificationForStudent()`
3. System calculates attendance % for all subjects
4. For subjects below 85%, AI generates personalized message
5. Notification saved to database (if not duplicate)
6. Student sees unread badge on bell icon

### Manual Flow
1. Student clicks 🔔 notification bell
2. Dropdown opens showing all notifications
3. Student clicks "🤖 Generate AI Alerts"
4. System calculates current attendance for ALL subjects
5. AI generates messages for all risk levels
6. New notifications appear in dropdown

## 🎨 Notification Categories

| Attendance % | Category | Color | Icon | Auto-Notify |
|-------------|----------|-------|------|-------------|
| < 75%       | Critical | Red   | 🚨   | ✅ Yes      |
| 75-85%      | Warning  | Orange| ⚠️   | ✅ Yes      |
| 85-95%      | Good     | Yellow| ✅   | ❌ Manual   |
| > 95%       | Excellent| Green | 🌟   | ❌ Manual   |

## 💡 Customization

### Modify Message Templates
Edit `backend/services/notificationService.js`:
```javascript
const templates = {
  critical: [
    "Your custom critical message here...",
    // Add more variations
  ],
  // ... other categories
};
```

### Change Risk Thresholds
Modify `categorizeRisk()` function:
```javascript
function categorizeRisk(percentage) {
  if (percentage < 70) {  // Changed from 75
    return { level: 'critical', color: 'red', priority: 1 };
  }
  // ...
}
```

### Adjust Auto-Notification Logic
In `backend/routes/student.js`:
```javascript
// Only notify for critical cases
if (risk.level !== 'critical') {
  continue;
}
```

## 🐛 Troubleshooting

### Notifications not appearing?
1. Check database table exists: `SELECT * FROM notifications LIMIT 1;`
2. Verify route is registered in `server.js`
3. Check browser console for errors
4. Verify token is valid: `localStorage.getItem('token')`

### No auto-notifications after attendance?
1. Check backend logs for errors
2. Ensure `generateNotificationForStudent()` is called
3. Verify attendance percentage is below threshold

### Duplicate notifications?
The system has built-in duplicate prevention (24-hour window). If still seeing duplicates:
1. Check the deduplication query in `notifications.js`
2. Verify indexes exist on notifications table

### � Email Issues

#### Emails not sending?
1. **Check backend logs**:
   - Look for: `✅ Email server is ready to send messages`
   - If you see warning: `⚠️ Email not configured` → Add EMAIL_USER and EMAIL_PASS to .env

2. **Verify .env configuration**:
   ```bash
   # In backend folder
   cat .env | Select-String EMAIL
   ```
   Should show EMAIL_USER and EMAIL_PASS

3. **Test SMTP connection**:
   - Restart backend server
   - Watch for connection verification message

#### Gmail not working?
1. **Enable 2-Step Verification** (required for App Passwords)
2. **Use App Password, NOT regular password**:
   - Generate at: https://myaccount.google.com/apppasswords
   - Must be 16 characters (no spaces)
3. **Check "Less secure apps"** is NOT needed (deprecated by Google)

#### Emails going to spam?
1. Students should add your email to contacts
2. Consider using a verified domain email (not Gmail)
3. Check SPF/DKIM records if using custom domain

#### Email sent but not received?
1. Check spam folder
2. Verify student email address in database: 
   ```sql
   SELECT id, name, email FROM users WHERE role='student';
   ```
3. Check email service logs in backend console
4. Verify `FRONTEND_URL` is correct in .env

#### Want to test emails?
Add this test endpoint to `routes/notifications.js`:
```javascript
router.get('/test-email', verifyToken, async (req, res) => {
  const { sendAttendanceEmail } = require('../services/emailService');
  const result = await sendAttendanceEmail({
    to: req.user.email,
    studentName: 'Test Student',
    subjectCode: 'TEST',
    subjectName: 'Test Subject',
    percentage: 70,
    type: 'critical',
    message: 'This is a test email notification!',
    absentDays: 6,
    totalDays: 20
  });
  res.json(result);
});
```
Then visit: `http://localhost:5000/api/notifications/test-email`

## �🔮 Future Enhancements

- [x] ✅ Email notifications for critical attendance
- [ ] Push notifications (web/mobile)
- [ ] Daily/weekly attendance summary via email
- [ ] Predictive alerts (e.g., "If you miss 2 more classes...")
- [ ] Parent notification system (CC parents on emails)
- [ ] WhatsApp integration via Twilio
- [ ] Scheduled cron job for daily attendance check
- [ ] SMS notifications for critical cases

## 📊 Database Schema

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  subject_code VARCHAR(50),
  subject_name VARCHAR(255),
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('critical', 'warning', 'good', 'excellent')),
  attendance_percentage INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);
```

## 👨‍💻 Developer Notes

- **Performance**: Background notification generation uses `setTimeout()` to avoid delaying attendance API response
- **Scalability**: Duplicate check uses indexed queries for fast lookups
- **Security**: All endpoints require authentication via JWT
- **Privacy**: Students can only access their own notifications

## 📞 Support

For issues or questions:
1. Check console logs (browser & server)
2. Review API responses in Network tab
3. Verify database state
4. Check IMPLEMENTATION_GUIDE.md for general setup

---

**Built with ❤️ for Acadence LMS**
