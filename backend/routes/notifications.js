const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  calculateStudentAttendance,
  categorizeRisk,
  generateAIMessage,
  sendEmailNotification
} = require('../services/notificationService');

// Get all notifications for the logged-in student
router.get('/', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50); // Last 50 notifications

    if (error) throw error;

    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(n => !n.is_read).length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread notification count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      unreadCount: count || 0
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// Generate AI notifications for a student based on current attendance
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Calculate attendance for all subjects
    const attendanceStats = await calculateStudentAttendance(studentId);

    // Generate notifications for each subject
    const notifications = [];
    
    for (const stat of attendanceStats) {
      const risk = categorizeRisk(stat.percentage);
      
      // Generate AI message
      const message = await generateAIMessage({
        studentName: student.name,
        subjectCode: stat.subject_code,
        subjectName: stat.subject_name,
        percentage: stat.percentage,
        riskLevel: risk.level,
        absentDays: stat.absentDays,
        totalDays: stat.totalDays
      });

      // Check if similar notification exists in last 24 hours (to avoid spam)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('student_id', studentId)
        .eq('subject_code', stat.subject_code)
        .eq('type', risk.level)
        .gte('created_at', oneDayAgo)
        .single();

      // Skip if similar notification sent recently
      if (recentNotif) {
        console.log(`Skipping duplicate notification for ${stat.subject_code}`);
        continue;
      }

      // Insert notification
      const { data: newNotification, error: insertError } = await supabase
        .from('notifications')
        .insert({
          student_id: studentId,
          subject_code: stat.subject_code,
          subject_name: stat.subject_name,
          message: message,
          type: risk.level,
          attendance_percentage: stat.percentage,
          is_read: false
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting notification for ${stat.subject_code}:`, insertError);
        continue;
      }

      notifications.push(newNotification);

      // Send email notification for critical/warning cases (async, don't wait)
      sendEmailNotification({
        studentEmail: student.email,
        studentName: student.name,
        subjectCode: stat.subject_code,
        subjectName: stat.subject_name,
        percentage: stat.percentage,
        riskLevel: risk.level,
        absentDays: stat.absentDays,
        totalDays: stat.totalDays
      }).catch(err => {
        console.error(`Failed to send email for ${stat.subject_code}:`, err);
      });
    }

    res.json({
      success: true,
      message: `Generated ${notifications.length} new notifications`,
      notifications,
      stats: attendanceStats
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate notifications',
      error: error.message
    });
  }
});

// Mark a notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const notificationId = req.params.id;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('student_id', studentId) // Ensure student can only mark their own notifications
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: data
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('is_read', false)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Marked ${data.length} notifications as read`,
      count: data.length
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete a notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const notificationId = req.params.id;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('student_id', studentId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Manual trigger for weekly attendance notifications (Admin/Testing only)
router.post('/send-weekly', verifyToken, async (req, res) => {
  try {
    // Optional: Add admin check here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Admin access required' });
    // }

    const { sendWeeklyAttendanceNotifications } = require('../services/weeklyScheduler');
    
    // Run the weekly job immediately
    console.log('📧 Manual trigger: Starting weekly notification job...');
    await sendWeeklyAttendanceNotifications();
    
    res.json({
      success: true,
      message: 'Weekly attendance notifications sent successfully'
    });
  } catch (error) {
    console.error('Error sending weekly notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send weekly notifications',
      error: error.message
    });
  }
});

// TEST ENDPOINT - No authentication required (for quick testing only!)
router.get('/test-weekly-email', async (req, res) => {
  try {
    console.log('\n🧪 TEST MODE: Sending weekly emails to all students...');
    
    const { sendWeeklyAttendanceNotifications } = require('../services/weeklyScheduler');
    
    // Run the weekly job immediately
    await sendWeeklyAttendanceNotifications();
    
    res.json({
      success: true,
      message: '✅ Test emails sent! Check your inbox (and spam folder)',
      note: 'Check the backend console for detailed logs'
    });
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test emails',
      error: error.message
    });
  }
});

module.exports = router;
