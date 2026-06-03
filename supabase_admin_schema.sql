-- ==========================================
-- TYM2MUV ADMIN SYSTEM DATABASE SCHEMA
-- Target Backend: Supabase PostgreSQL
-- ==========================================

-- Ensure admin roles exist in our ENUM (If redefining or migrating)
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ==========================================
-- 1. ADMIN SYSTEM TABLES
-- ==========================================

-- System Settings
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Audit Logs
CREATE TABLE admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- e.g., 'APPROVE_PROPERTY', 'BLOCK_USER', 'UPDATE_SETTINGS'
    target_entity TEXT NOT NULL, -- e.g., 'properties', 'profiles'
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Reports (From users against properties or other users)
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('property', 'user', 'message')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Snapshots (For fast admin dashboard charts)
CREATE TABLE platform_analytics_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    details JSONB,
    UNIQUE(snapshot_date, metric_name)
);

-- Property Views (Tracking for analytics)
CREATE TABLE property_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for guest views
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. INDEXES
-- ==========================================

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_entity, target_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_property_views_prop_date ON property_views(property_id, created_at);

-- ==========================================
-- 3. ZERO-TRUST SECURITY (RLS POLICIES)
-- ==========================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Helper Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Assuming 'profiles' table has 'role' column tracking 'admin' or 'super_admin'
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- System Settings
-- Only admins can read and update. Public generally cannot read raw settings unless explicitly allowed via RPC.
CREATE POLICY "Admins can read settings" ON system_settings FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (is_admin());

-- Admin Logs
-- Only admins can view logs. Only admins (via backend/functions) can insert logs. No updates or deletes.
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT WITH CHECK (is_admin());

-- Reports
-- Admins can view and manage all reports. Users can insert reports.
CREATE POLICY "Admins manage all reports" ON reports FOR ALL USING (is_admin());
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Analytics
-- Only admins can view platform analytics.
CREATE POLICY "Admins view analytics" ON platform_analytics_snapshots FOR SELECT USING (is_admin());

-- Property Views
-- Anyone can insert a view (or backend triggers it). Admins can select all. Property owners can select views for their properties.
CREATE POLICY "Anyone can insert views" ON property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read all views" ON property_views FOR SELECT USING (is_admin());
CREATE POLICY "Agents can read views of own properties" ON property_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_views.property_id AND agent_id = auth.uid())
);

-- ==========================================
-- 4. ADMIN BACKEND FUNCTIONS (RPCs)
-- ==========================================

-- RPC: Get Platform Stats (Avoids full table scans on client)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB AS $$
DECLARE
  total_users INT;
  total_agents INT;
  total_properties INT;
  active_rentals INT;
  pending_requests INT;
BEGIN
  -- Security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_users FROM profiles WHERE role = 'tenant';
  SELECT COUNT(*) INTO total_agents FROM profiles WHERE role = 'agent';
  SELECT COUNT(*) INTO total_properties FROM properties;
  SELECT COUNT(*) INTO active_rentals FROM rental_agreements WHERE status = 'active';
  SELECT COUNT(*) INTO pending_requests FROM rental_requests WHERE status = 'pending';

  RETURN jsonb_build_object(
    'total_users', total_users,
    'total_agents', total_agents,
    'total_properties', total_properties,
    'active_rentals', active_rentals,
    'pending_requests', pending_requests
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Admin Action to Approve Property
CREATE OR REPLACE FUNCTION admin_approve_property(target_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE properties SET status = 'available' WHERE id = target_property_id;
  
  INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id)
  VALUES (auth.uid(), 'APPROVE_PROPERTY', 'properties', target_property_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Admin Action to Suspend User (Agent/Tenant)
CREATE OR REPLACE FUNCTION admin_suspend_user(target_user_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE profiles SET role = 'suspended'::user_role WHERE id = target_user_id;
  
  INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id, details)
  VALUES (auth.uid(), 'SUSPEND_USER', 'profiles', target_user_id, jsonb_build_object('reason', reason));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
