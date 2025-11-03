-- SQL Script to add mark sections and class duration

-- Step 1: Add mark columns to enrollments table for different sections
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS st1_marks DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS st2_marks DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS evaluation_marks DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS end_term_marks DECIMAL(5,2);

-- Add constraints to ensure marks are between 0 and 100
ALTER TABLE enrollments 
ADD CONSTRAINT st1_marks_range CHECK (st1_marks IS NULL OR (st1_marks >= 0 AND st1_marks <= 100)),
ADD CONSTRAINT st2_marks_range CHECK (st2_marks IS NULL OR (st2_marks >= 0 AND st2_marks <= 100)),
ADD CONSTRAINT evaluation_marks_range CHECK (evaluation_marks IS NULL OR (evaluation_marks >= 0 AND evaluation_marks <= 100)),
ADD CONSTRAINT end_term_marks_range CHECK (end_term_marks IS NULL OR (end_term_marks >= 0 AND end_term_marks <= 100));

-- Step 2: Add duration in hours to classes table (e.g., 1, 1.5, 2, 3 hours)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(3,1) DEFAULT 1.0;

-- Add constraint to ensure duration is reasonable (0.5 to 5 hours)
ALTER TABLE classes 
ADD CONSTRAINT duration_range CHECK (duration_hours >= 0.5 AND duration_hours <= 5.0);

-- Step 3: Rename schedule_time to start_time for clarity (optional)
-- Only run this if you have schedule_time column
ALTER TABLE classes 
RENAME COLUMN schedule_time TO start_time;

-- If renaming doesn't work, use this approach instead:
-- ALTER TABLE classes ADD COLUMN IF NOT EXISTS start_time TIME;
-- UPDATE classes SET start_time = schedule_time WHERE schedule_time IS NOT NULL;
-- ALTER TABLE classes DROP COLUMN IF EXISTS schedule_time;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
AND column_name IN ('st1_marks', 'st2_marks', 'evaluation_marks', 'end_term_marks');

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name IN ('start_time', 'duration_hours', 'schedule_time');
