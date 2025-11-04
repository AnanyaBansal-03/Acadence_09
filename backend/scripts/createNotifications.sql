-- Create notifications table for AI-powered attendance alerts
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create composite index for student's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_student_unread ON notifications(student_id, is_read, created_at DESC);

COMMENT ON TABLE notifications IS 'Stores AI-generated personalized attendance notifications for students';
COMMENT ON COLUMN notifications.type IS 'critical: <75%, warning: 75-85%, good: 85-95%, excellent: >95%';
COMMENT ON COLUMN notifications.attendance_percentage IS 'Attendance % at time of notification generation';
