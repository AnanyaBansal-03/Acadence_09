-- Create integration_tokens table to store OAuth tokens
CREATE TABLE IF NOT EXISTS integration_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'google_classroom', 'github', 'zoom', etc.
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    google_email VARCHAR(255),
    google_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_synced TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Create external_assignments table to store synced assignments
CREATE TABLE IF NOT EXISTS external_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- 'google_classroom', 'moodle', etc.
    google_id VARCHAR(255), -- External platform's assignment ID
    course_id VARCHAR(255),
    course_name VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    max_points DECIMAL(10, 2),
    work_type VARCHAR(50), -- 'ASSIGNMENT', 'SHORT_ANSWER_QUESTION', 'MULTIPLE_CHOICE_QUESTION'
    state VARCHAR(50), -- 'PUBLISHED', 'DRAFT', 'DELETED'
    link TEXT, -- Link to the assignment on external platform
    creation_time TIMESTAMP,
    update_time TIMESTAMP,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, source, google_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_integration_tokens_user_platform 
    ON integration_tokens(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_external_assignments_user_source 
    ON external_assignments(user_id, source);

CREATE INDEX IF NOT EXISTS idx_external_assignments_due_date 
    ON external_assignments(due_date);

-- Add comments
COMMENT ON TABLE integration_tokens IS 'Stores OAuth tokens for external platform integrations';
COMMENT ON TABLE external_assignments IS 'Stores assignments synced from external platforms like Google Classroom';
