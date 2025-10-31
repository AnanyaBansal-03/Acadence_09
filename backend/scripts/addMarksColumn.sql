-- Add marks column to enrollments table
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS marks DECIMAL(5,2);

-- Add constraint to ensure marks are between 0 and 100
ALTER TABLE enrollments ADD CONSTRAINT marks_range CHECK (marks IS NULL OR (marks >= 0 AND marks <= 100));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollments_marks ON enrollments(marks);

-- Update any existing null values to make queries easier (optional)
-- UPDATE enrollments SET marks = NULL WHERE marks IS NULL;
