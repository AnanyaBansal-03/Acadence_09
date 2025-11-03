-- SQL Script to add group system for students

-- Step 1: Add group_name to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS group_name VARCHAR(10);

-- Add constraint to ensure group name is valid (G1-G10)
ALTER TABLE classes 
ADD CONSTRAINT group_name_format CHECK (group_name ~ '^G[0-9]+$' OR group_name IS NULL);

-- Step 2: Add group_name to users table (for students)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS group_name VARCHAR(10);

-- Add constraint for users group name
ALTER TABLE users 
ADD CONSTRAINT user_group_name_format CHECK (group_name ~ '^G[0-9]+$' OR group_name IS NULL);

-- Step 3: Add comments for clarity
COMMENT ON COLUMN classes.group_name IS 'Group designation for the class (G1, G2, G3, etc.)';
COMMENT ON COLUMN users.group_name IS 'Group designation for students (G1, G2, G3, etc.)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name = 'group_name';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'group_name';
