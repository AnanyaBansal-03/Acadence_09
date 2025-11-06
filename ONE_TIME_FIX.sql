-- SIMPLE ONE-TIME FIX FOR EXISTING DATA
-- Run this once in Supabase SQL Editor to make all current attendance visible

UPDATE attendance 
SET is_submitted = true;

-- Check it worked
SELECT 
    'Total' as type, COUNT(*) as count FROM attendance
UNION ALL
SELECT 
    'Submitted (TRUE)' as type, COUNT(*) as count FROM attendance WHERE is_submitted = true
UNION ALL  
SELECT 
    'Pending (FALSE)' as type, COUNT(*) as count FROM attendance WHERE is_submitted = false;
