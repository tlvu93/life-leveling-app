-- Life Leveling Database Schema
-- This file contains the complete database schema for the Life Leveling application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age_range_min INTEGER NOT NULL,
    age_range_max INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    family_mode_enabled BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    privacy_preferences JSONB DEFAULT '{
        "allowPeerComparisons": true,
        "allowFamilyViewing": false,
        "shareGoalsWithFamily": false,
        "shareProgressWithFamily": false,
        "allowAnonymousDataCollection": true,
        "dataRetentionConsent": true
    }'::jsonb
);

-- User interests and skill levels
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    current_level INTEGER CHECK (current_level BETWEEN 1 AND 4) NOT NULL,
    intent_level VARCHAR(20) CHECK (intent_level IN ('casual', 'average', 'invested', 'competitive')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, subcategory)
);

-- Historical skill level tracking
CREATE TABLE IF NOT EXISTS skill_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_interest_id UUID REFERENCES user_interests(id) ON DELETE CASCADE,
    previous_level INTEGER,
    new_level INTEGER NOT NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    retrospective_id UUID,
    notes TEXT
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interest_category VARCHAR(50) NOT NULL,
    goal_type VARCHAR(20) CHECK (goal_type IN ('skill_increase', 'project_completion', 'broad_promise')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_level INTEGER,
    timeframe VARCHAR(20) CHECK (timeframe IN ('weekly', 'monthly', 'yearly')) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    target_date TIMESTAMP,
    completed_at TIMESTAMP
);

-- Retrospectives table
CREATE TABLE IF NOT EXISTS retrospectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('weekly', 'monthly', 'yearly')) NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),
    insights JSONB,
    skill_updates JSONB,
    goals_reviewed JSONB
);

-- Anonymized comparison data (separate from user data for privacy)
CREATE TABLE IF NOT EXISTS cohort_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age_range_min INTEGER NOT NULL,
    age_range_max INTEGER NOT NULL,
    interest_category VARCHAR(50) NOT NULL,
    intent_level VARCHAR(20) NOT NULL,
    skill_level INTEGER NOT NULL,
    user_count INTEGER NOT NULL,
    percentile_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(age_range_min, age_range_max, interest_category, intent_level, skill_level)
);

-- Family relationships table
CREATE TABLE IF NOT EXISTS family_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    child_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) DEFAULT 'parent_child',
    child_consent_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(parent_user_id, child_user_id)
);

-- Family activity log table for transparency
CREATE TABLE IF NOT EXISTS family_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES family_relationships(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'consent_updated', 'dashboard_accessed', 'privacy_changed', etc.
    performed_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    details JSONB, -- Additional context about the action
    created_at TIMESTAMP DEFAULT NOW()
);

-- Family safety alerts table
CREATE TABLE IF NOT EXISTS family_safety_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES family_relationships(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'privacy_change', 'unusual_activity', 'consent_revoked', etc.
    severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Family safety settings table
CREATE TABLE IF NOT EXISTS family_safety_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES family_relationships(id) ON DELETE CASCADE UNIQUE,
    enable_activity_alerts BOOLEAN DEFAULT TRUE,
    enable_privacy_change_alerts BOOLEAN DEFAULT TRUE,
    enable_unusual_activity_detection BOOLEAN DEFAULT TRUE,
    require_parent_approval_for_new_connections BOOLEAN DEFAULT TRUE,
    max_daily_interaction_time INTEGER DEFAULT 60, -- in minutes
    allowed_interaction_hours JSONB DEFAULT '{"start": "08:00", "end": "20:00"}'::jsonb,
    updated_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Predefined paths table
CREATE TABLE IF NOT EXISTS predefined_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interest_category VARCHAR(50) NOT NULL,
    path_name VARCHAR(255) NOT NULL,
    description TEXT,
    age_range_min INTEGER,
    age_range_max INTEGER,
    intent_levels VARCHAR(100)[], -- Array of applicable intent levels
    stages JSONB NOT NULL, -- Array of path stages with requirements
    synergies JSONB, -- Related skills and their boost factors
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User path progress table
CREATE TABLE IF NOT EXISTS user_path_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    path_id UUID REFERENCES predefined_paths(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 0,
    stages_completed JSONB DEFAULT '[]',
    started_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, path_id)
);

-- Simulation scenarios table (for Architect Mode)
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scenario_name VARCHAR(255) NOT NULL,
    effort_allocation JSONB NOT NULL, -- Skill -> effort percentage mapping
    forecasted_results JSONB NOT NULL, -- Predicted outcomes
    timeframe_weeks INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_converted_to_goals BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_age_range ON users(age_range_min, age_range_max);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_category ON user_interests(category);
CREATE INDEX IF NOT EXISTS idx_skill_history_user_interest_id ON skill_history(user_interest_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_retrospectives_user_id ON retrospectives(user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_stats_lookup ON cohort_stats(age_range_min, age_range_max, interest_category, intent_level);
CREATE INDEX IF NOT EXISTS idx_family_relationships_parent ON family_relationships(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_child ON family_relationships(child_user_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_log_relationship ON family_activity_log(relationship_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_log_user ON family_activity_log(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_family_safety_alerts_relationship ON family_safety_alerts(relationship_id);
CREATE INDEX IF NOT EXISTS idx_family_safety_alerts_resolved ON family_safety_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_family_safety_settings_relationship ON family_safety_settings(relationship_id);
CREATE INDEX IF NOT EXISTS idx_predefined_paths_category ON predefined_paths(interest_category);
CREATE INDEX IF NOT EXISTS idx_user_path_progress_user_id ON user_path_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_user_id ON simulation_scenarios(user_id);

-- Insert some sample predefined paths
INSERT INTO predefined_paths (interest_category, path_name, description, age_range_min, age_range_max, intent_levels, stages, synergies) VALUES
('Music', 'Instrumental Journey', 'Learn and master a musical instrument', 6, 99, ARRAY['casual', 'average', 'invested', 'competitive'], 
 '[
   {"stage": 1, "name": "Explore Instruments", "description": "Try different instruments to find your favorite", "requirements": {"level": 1}},
   {"stage": 2, "name": "Basic Skills", "description": "Learn fundamental techniques and simple songs", "requirements": {"level": 2}},
   {"stage": 3, "name": "Intermediate Player", "description": "Play more complex pieces and understand music theory", "requirements": {"level": 3}},
   {"stage": 4, "name": "Advanced Musician", "description": "Perform publicly or teach others", "requirements": {"level": 4}}
 ]'::jsonb,
 '{"Math": 0.2, "Creativity": 0.3}'::jsonb),

('Sports', 'Athletic Development', 'Build physical fitness and sports skills', 6, 99, ARRAY['casual', 'average', 'invested', 'competitive'],
 '[
   {"stage": 1, "name": "Try Different Sports", "description": "Explore various physical activities", "requirements": {"level": 1}},
   {"stage": 2, "name": "Choose Your Sport", "description": "Focus on 1-2 sports you enjoy most", "requirements": {"level": 2}},
   {"stage": 3, "name": "Competitive Player", "description": "Join teams or compete in events", "requirements": {"level": 3}},
   {"stage": 4, "name": "Elite Athlete", "description": "Coach others or compete at high levels", "requirements": {"level": 4}}
 ]'::jsonb,
 '{"Health": 0.4, "Communication": 0.2}'::jsonb),

('Technical', 'Programming Path', 'Learn to code and build software', 10, 99, ARRAY['casual', 'average', 'invested', 'competitive'],
 '[
   {"stage": 1, "name": "Code Basics", "description": "Learn your first programming language", "requirements": {"level": 1}},
   {"stage": 2, "name": "Build Projects", "description": "Create simple applications and websites", "requirements": {"level": 2}},
   {"stage": 3, "name": "Advanced Developer", "description": "Work on complex systems and frameworks", "requirements": {"level": 3}},
   {"stage": 4, "name": "Tech Expert", "description": "Lead projects or start your own tech company", "requirements": {"level": 4}}
 ]'::jsonb,
 '{"Math": 0.3, "Creativity": 0.2}'::jsonb);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_interests_updated_at BEFORE UPDATE ON user_interests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_paths_updated_at BEFORE UPDATE ON predefined_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_path_progress_updated_at BEFORE UPDATE ON user_path_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();