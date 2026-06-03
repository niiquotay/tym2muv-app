-- ========================================================================================
-- TYM2MUV ADMIN SYSTEM & SECURITY IMPLEMENTATION
-- Target Backend: Supabase PostgreSQL
-- ========================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 1: ADMIN ROLE SYSTEM
-- ==========================================

-- Helper Function: Check if current user is an Admin (or Super Admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Check if current user is a Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STEP 2: ADMIN TABLES
-- ==========================================

-- 2.1 Admin Logs Table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enums for reports table
DO $$ BEGIN
    CREATE TYPE report_target_type AS ENUM ('user', 'property', 'agent', 'message');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status_type AS ENUM ('open', 'resolved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2.2 Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type report_target_type NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status report_status_type DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reports_modtime ON public.reports;
CREATE TRIGGER update_reports_modtime
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE PROCEDURE public.update_admin_tables_updated_at();

DROP TRIGGER IF EXISTS update_settings_modtime ON public.system_settings;
CREATE TRIGGER update_settings_modtime
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE PROCEDURE public.update_admin_tables_updated_at();

-- ==========================================
-- STEP 3: ADMIN ACTION LOGGER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action_type TEXT,
    p_target_table TEXT,
    p_target_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    -- Security Enforement: Ensure caller is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can perform logging of admin actions.';
    END IF;

    -- Insert audit log
    INSERT INTO public.admin_logs (
        admin_id,
        action_type,
        target_table,
        target_id,
        description,
        metadata
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_target_table,
        p_target_id,
        p_description,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STEP 4: ADMIN DASHBOARD METRICS VIEW
-- ==========================================

-- View aggregating key metrics for admin insight
CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'tenant') AS total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent') AS total_agents,
    (SELECT COUNT(*) FROM public.properties) AS total_properties,
    (SELECT COUNT(*) FROM public.rental_requests) AS total_rental_requests,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'open') AS open_reports;

-- ==========================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 ADMIN LOGS RLS
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can insert admin logs" ON public.admin_logs
    FOR INSERT WITH CHECK (public.is_admin());

-- 5.2 SYSTEM SETTINGS RLS
DROP POLICY IF EXISTS "Admins can read settings" ON public.system_settings;
CREATE POLICY "Admins can read settings" ON public.system_settings
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update settings" ON public.system_settings;
CREATE POLICY "Admins can update settings" ON public.system_settings
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert settings" ON public.system_settings;
CREATE POLICY "Admins can insert settings" ON public.system_settings
    FOR INSERT WITH CHECK (public.is_admin());

-- 5.3 REPORTS RLS
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Reporters can view their own reports" ON public.reports;
CREATE POLICY "Reporters can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;
CREATE POLICY "Admins can update all reports" ON public.reports
    FOR UPDATE USING (public.is_admin());


-- ==========================================
-- STEP 6: INDEXING & PERFORMANCE
-- ==========================================

-- Admin Logs Indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs (target_table, target_id);

-- Reports Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports (reporter_id);

-- ========================================================================================
-- END OF ADMIN SYSTEM SCRIPT
-- ========================================================================================
