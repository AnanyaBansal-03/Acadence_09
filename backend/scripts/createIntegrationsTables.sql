-- =====================================================
-- GOOGLE CLASSROOM INTEGRATION TABLES
-- =====================================================

-- Table to store user integration tokens and status
CREATE TABLE IF NOT EXISTS user_integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- e.g., 'google_classroom', 'github', 'zoom'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Table to store external assignments from Google Classroom
CREATE TABLE IF NOT EXISTS external_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id INTEGER REFERENCES user_integrations(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL, -- 'google_classroom', 'github', etc.
  external_id VARCHAR(255) NOT NULL, -- ID from external platform
  course_id VARCHAR(255),
  course_name VARCHAR(255),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  status VARCHAR(50), -- 'pending', 'submitted', 'graded', 'overdue'
  points DECIMAL(5,2),
  link TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, source, external_id)
);

-- Table to store Google Classroom courses
CREATE TABLE IF NOT EXISTS external_courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id INTEGER REFERENCES user_integrations(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  section VARCHAR(100),
  description TEXT,
  room VARCHAR(100),
  owner_id VARCHAR(255),
  enrollment_code VARCHAR(50),
  course_state VARCHAR(50), -- 'ACTIVE', 'ARCHIVED', 'PROVISIONED', 'DECLINED'
  alternate_link TEXT,
  teacher_group_email VARCHAR(255),
  course_group_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, source, external_id)
);

-- Indexes for better performance
CREATE INDEX idx_user_integrations_user_platform ON user_integrations(user_id, platform);
CREATE INDEX idx_external_assignments_user_source ON external_assignments(user_id, source);
CREATE INDEX idx_external_assignments_due_date ON external_assignments(due_date);
CREATE INDEX idx_external_courses_user_source ON external_courses(user_id, source);

-- Sync log table to track integration sync history
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER REFERENCES user_integrations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  sync_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started TIMESTAMP DEFAULT NOW(),
  sync_completed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_integration ON integration_sync_logs(integration_id);
CREATE INDEX idx_sync_logs_user ON integration_sync_logs(user_id);
