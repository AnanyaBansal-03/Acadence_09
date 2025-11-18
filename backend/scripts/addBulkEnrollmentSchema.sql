-- Add branch and enrollment year fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS branch VARCHAR(100),
ADD COLUMN IF NOT EXISTS enrollment_year INTEGER,
ADD COLUMN IF NOT EXISTS degree_duration INTEGER DEFAULT 4;

-- Create branches table for reference
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    degree_duration INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert available branches
INSERT INTO branches (branch_code, branch_name, degree_duration) VALUES
('CSE', 'Computer Science Engineering', 4),
('CSE-AIML', 'CSE AI-ML', 4),
('CSE-AIFT', 'CS AI-FT', 4),
('ECE', 'Electronics', 4),
('ME', 'Mechanical', 4),
('CE', 'Civil', 4),
('PHARMACY', 'Pharmacy', 4),
('LAW', 'Law', 3),
('DESIGN', 'Design', 4),
('ARCHITECTURE', 'Architecture', 5)
ON CONFLICT (branch_code) DO NOTHING;

-- Create bulk_enrollment_logs table to track uploads
CREATE TABLE IF NOT EXISTS bulk_enrollment_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    total_students INTEGER,
    successful_enrollments INTEGER,
    failed_enrollments INTEGER,
    file_name VARCHAR(255),
    upload_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50),
    error_details TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch);
CREATE INDEX IF NOT EXISTS idx_users_enrollment_year ON users(enrollment_year);

-- Add comment
COMMENT ON COLUMN users.enrollment_year IS 'Year when student enrolled (e.g., 2023)';
COMMENT ON COLUMN users.degree_duration IS 'Duration of degree program in years';
