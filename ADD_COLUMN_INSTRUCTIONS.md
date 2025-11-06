# Adding is_submitted Column to Attendance Table

## Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** from the left sidebar
4. Click **New Query**
5. Paste the following SQL:

```sql
-- Add is_submitted column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;

-- Update existing attendance records to be submitted (so old data is visible)
UPDATE attendance 
SET is_submitted = true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_is_submitted ON attendance(is_submitted);
```

6. Click **Run** button
7. You should see "Success. No rows returned"

## Option 2: Using Node.js Script

1. Open terminal in the backend folder
2. Run:
   ```bash
   cd backend
   node scripts/addIsSubmittedColumn.js
   ```

## Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance' AND column_name = 'is_submitted';

-- Check current data
SELECT id, student_id, class_id, status, is_submitted, date 
FROM attendance 
LIMIT 10;
```

## What This Does

- **Adds `is_submitted` column** with default value `false`
- **Sets all existing records to `true`** so your old attendance data is still visible
- **New QR scans** will have `is_submitted = false` until teacher submits
- **After teacher submits** attendance, `is_submitted` will be set to `true`

## Rollback (if needed)

If you need to remove the column:

```sql
ALTER TABLE attendance DROP COLUMN IF EXISTS is_submitted;
DROP INDEX IF EXISTS idx_attendance_is_submitted;
```
