-- Quick Setup Script for Notification System
-- Run this in your Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_code VARCHAR(50),
  subject_name VARCHAR(255),
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('critical', 'warning', 'good', 'excellent')),
  attendance_percentage INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_student_unread ON notifications(student_id, is_read, created_at DESC);

-- 3. Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores AI-generated personalized attendance notifications for students';
COMMENT ON COLUMN notifications.type IS 'critical: <75%, warning: 75-85%, good: 85-95%, excellent: >95%';
COMMENT ON COLUMN notifications.attendance_percentage IS 'Attendance % at time of notification generation';

-- 4. Verify setup
SELECT 
  'Notifications table created successfully!' as status,
  COUNT(*) as existing_notifications
FROM notifications;

-- 5. Test notification insertion (optional - remove after testing)
-- INSERT INTO notifications (student_id, subject_code, subject_name, message, type, attendance_percentage)
-- VALUES (1, 'DSOOPS', 'Data Structures using OOP', '🚨 Test notification: Your attendance needs attention!', 'warning', 78);
