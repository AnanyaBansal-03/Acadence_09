-- Add subject_code field to classes table to group classes by subject
-- This allows multiple class sessions (Mon, Tue, Wed) to belong to same subject

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);

-- Update existing classes to have subject codes
-- Extract subject from class name (e.g., "ITT - Monday" -> "ITT")
UPDATE classes 
SET subject_code = CASE 
  WHEN name ILIKE '%DSOOPS%' THEN 'DSOOPS'
  WHEN name ILIKE '%FEE-II%' THEN 'FEE'
  WHEN name ILIKE '%DBMS%' THEN 'DBMS'
  WHEN name ILIKE '%OOSE%' THEN 'OOSE'
  WHEN name ILIKE '%DS%' THEN 'DS'
  ELSE UPPER(SPLIT_PART(name, ' ', 1))
END
WHERE subject_code IS NULL;

-- Create index for faster subject-based queries
CREATE INDEX IF NOT EXISTS idx_classes_subject_group 
ON classes(subject_code, group_name);

-- Add comment for documentation
COMMENT ON COLUMN classes.subject_code IS 'Subject identifier to group multiple class sessions (e.g., ITT has sessions on Mon, Tue, Wed)';
