-- Add is_submitted column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;

-- Update ALL existing attendance records to be submitted (so old data is visible)
-- This makes all current attendance visible to students and admin
UPDATE attendance 
SET is_submitted = true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_is_submitted ON attendance(is_submitted);

-- Verify the changes
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_submitted = true) as submitted_records,
    COUNT(*) FILTER (WHERE is_submitted = false) as pending_records
FROM attendance;
