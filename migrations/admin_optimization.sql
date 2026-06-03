-- Create indexes for common admin filters
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at ON properties(status, created_at);
CREATE INDEX IF NOT EXISTS idx_properties_agent_status ON properties(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_role_verified ON profiles(role, is_verified);
