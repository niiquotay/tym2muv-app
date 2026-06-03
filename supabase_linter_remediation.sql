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
-- STEP 3: RESOLVE SEARCH PATH MUTABILITY WARNINGS
-- ==========================================
-- Set explicit search paths on SECURITY DEFINER functions to prevent search path hijacking.
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.log_property_view(uuid, uuid, text) SET search_path = public;

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
-- STEP 5: RESOLVE SECURITY DEFINER RPC ACCESS FOR PUBLIC ROLES
-- ==========================================
-- 5.1 Revoke EXECUTE on all SECURITY DEFINER functions from PUBLIC (which includes anon and authenticated)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_property_view(uuid, uuid, text) FROM PUBLIC;

-- 5.2 Grant EXECUTE only to specific roles who require execution access
-- The RBAC helper functions are queried during table RLS checks, so all client roles must be able to execute them.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated, service_role;

-- log_admin_action is a sensitive operation and should only be triggered by the service_role edge function backend
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) TO service_role;

-- log_property_view is safe to trigger by authenticated users and anonymous website guests
GRANT EXECUTE ON FUNCTION public.log_property_view(uuid, uuid, text) TO anon, authenticated, service_role;
