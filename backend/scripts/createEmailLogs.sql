-- Create email_logs table to track all email sends
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'skipped'
  error_message TEXT,
  email_type VARCHAR(100), -- 'attendance_warning', 'grade_report', etc.
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_email_logs_student_id ON email_logs(student_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);

-- Add comment
COMMENT ON TABLE email_logs IS 'Tracks all emails sent by the system for monitoring and debugging';
