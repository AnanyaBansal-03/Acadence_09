-- ================================================
-- Fix is_submitted Column and RLS Policies
-- ================================================

-- Step 1: Check if column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance' AND column_name = 'is_submitted';

-- Step 2: Check current values
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_submitted = true) as submitted_count,
    COUNT(*) FILTER (WHERE is_submitted = false) as pending_count,
    COUNT(*) FILTER (WHERE is_submitted IS NULL) as null_count
FROM attendance;

-- Step 3: Update ALL records to TRUE (to make existing data visible)
UPDATE attendance 
SET is_submitted = true
WHERE is_submitted = false OR is_submitted IS NULL;

-- Step 4: Check RLS policies on attendance table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'attendance';

-- Step 5: Verify the update worked
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_submitted = true) as submitted_count,
    COUNT(*) FILTER (WHERE is_submitted = false) as pending_count
FROM attendance;

-- Step 6: Sample of updated records
SELECT id, student_id, class_id, status, is_submitted, date
FROM attendance
ORDER BY date DESC
LIMIT 10;
