-- Add is_submitted column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;

-- Update existing attendance records to be submitted (so old data is visible)
UPDATE attendance 
SET is_submitted = true 
WHERE is_submitted IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_is_submitted ON attendance(is_submitted);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance' AND column_name = 'is_submitted';
