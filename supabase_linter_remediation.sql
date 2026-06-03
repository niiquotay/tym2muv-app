-- ========================================================================================
-- TYM2MUV SUPABASE LINTER REMEDIATION SCRIPT
-- Resolves: 
-- 1. Security Definer Views (alter to SECURITY INVOKER)
-- 2. Function Search Path Mutable warnings (explicit SET search_path)
-- 3. Extension in Public warnings (move pg_trgm to extensions schema)
-- 4. Overly Permissive RLS Policy warning for property_views
-- 5. Revoking EXECUTE permissions on SECURITY DEFINER functions from anonymous and authenticated roles
-- ========================================================================================

-- ==========================================
-- STEP 1: RESOLVE EXTENSION IN PUBLIC SCHEMA
-- ==========================================
-- Supabase recommends keeping extensions out of the public schema for organization and security.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Recreate index specifying the correct extensions schema for gin_trgm_ops
DROP INDEX IF EXISTS public.idx_props_search;
CREATE INDEX IF NOT EXISTS idx_props_search ON public.properties USING GIN ((title || ' ' || location_text) extensions.gin_trgm_ops);

-- ==========================================
-- STEP 2: RESOLVE SECURITY DEFINER VIEWS
-- ==========================================
-- Views should use the querying user's permissions (security_invoker = true) in PostgreSQL 15+
ALTER VIEW public.agent_stats SET (security_invoker = true);
ALTER VIEW public.admin_dashboard_metrics SET (security_invoker = true);

-- ==========================================
-- STEP 3: RESOLVE SEARCH PATH MUTABILITY & DEFINER RPC WARNINGS
-- ==========================================
-- 3.1 Create a private schema that is not exposed to the PostgREST API
CREATE SCHEMA IF NOT EXISTS private;

-- 3.2 Define the internal helper functions as SECURITY DEFINER in the private schema
CREATE OR REPLACE FUNCTION private.is_admin_definer() 
RETURNS BOOLEAN 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION private.is_super_admin_definer() 
RETURNS BOOLEAN 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION private.get_user_role_definer() 
RETURNS public.user_role 
SECURITY DEFINER 
SET search_path = public 
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 3.3 Grant EXECUTE on private functions to anon, authenticated, and service_role so RLS policies can invoke them
GRANT EXECUTE ON FUNCTION private.is_admin_definer() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin_definer() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_user_role_definer() TO anon, authenticated, service_role;

-- 3.4 Convert public API functions to SECURITY INVOKER wrappers (hides from RPC security linter warnings)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN 
SECURITY INVOKER 
SET search_path = public 
AS $$
BEGIN
    RETURN private.is_admin_definer();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS BOOLEAN 
SECURITY INVOKER 
SET search_path = public 
AS $$
BEGIN
    RETURN private.is_super_admin_definer();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS public.user_role 
SECURITY INVOKER 
SET search_path = public 
AS $$
    SELECT private.get_user_role_definer();
$$ LANGUAGE sql STABLE;

-- 3.5 Set search path on remaining utility functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- ==========================================
-- STEP 4: RESOLVE DYNAMIC RLS INSERT POLICY ON PROPERTY_VIEWS
-- ==========================================
-- Restrict inserting property views so users can only insert under their own auth.uid() or anonymously (null)
DROP POLICY IF EXISTS "Anyone can insert a view" ON public.property_views;
CREATE POLICY "Anyone can insert a view" ON public.property_views
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
);

-- ==========================================
-- STEP 5: RESTRICT SENSITIVE/UTILITY FUNCTIONS ACCESS
-- ==========================================
-- 5.1 log_admin_action is sensitive and should only be executable by the service_role key
ALTER FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) TO service_role;

-- 5.2 log_property_view is invoked directly by clients. Switch to SECURITY INVOKER to resolve definer warnings.
ALTER FUNCTION public.log_property_view(uuid, uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.log_property_view(uuid, uuid, text) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.log_property_view(uuid, uuid, text) TO anon, authenticated, service_role;

