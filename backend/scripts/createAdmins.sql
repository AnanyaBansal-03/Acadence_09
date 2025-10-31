-- Create Admin Users (bypassing email verification)
-- Run this in Supabase SQL Editor

-- First, let's insert 3 admin users
-- Password for all: "admin123" (hashed with bcrypt)
-- You can change the passwords after running this

INSERT INTO users (name, email, password, role, email_verified, created_at)
VALUES 
  (
    'Admin One',
    'admin1@acadence.com',
    '$2a$10$rZ7qN5H.xQh5vYKX5y5hHuXKp0p8YqJ3Jz6mN8H.9L4kR7H5Y6K0O',  -- password: admin123
    'admin',
    true,  -- email already verified
    NOW()
  ),
  (
    'Admin Two', 
    'admin2@acadence.com',
    '$2a$10$rZ7qN5H.xQh5vYKX5y5hHuXKp0p8YqJ3Jz6mN8H.9L4kR7H5Y6K0O',  -- password: admin123
    'admin',
    true,  -- email already verified
    NOW()
  ),
  (
    'Admin Three',
    'admin3@acadence.com', 
    '$2a$10$rZ7qN5H.xQh5vYKX5y5hHuXKp0p8YqJ3Jz6mN8H.9L4kR7H5Y6K0O',  -- password: admin123
    'admin',
    true,  -- email already verified
    NOW()
  )
ON CONFLICT (email) DO NOTHING;  -- Don't insert if email already exists

-- Verify the admins were created
SELECT id, name, email, role, email_verified 
FROM users 
WHERE role = 'admin';

-- If you want to update existing users to admin role with verified email:
-- UPDATE users 
-- SET role = 'admin', email_verified = true 
-- WHERE email IN ('admin1@acadence.com', 'admin2@acadence.com', 'admin3@acadence.com');
