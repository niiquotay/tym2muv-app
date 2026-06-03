-- ========================================================================================
-- TYM2MUV SECURITY LOCKDOWN SCRIPT
-- Enforces:
-- 1. NO direct DB writes from frontend (anon, authenticated)
-- 2. NO direct RPC execution of sensitive functions from frontend
-- 3. ONLY read-safe data allowed for frontend clients
-- 4. ALL writes must come through Edge Functions (service_role)
-- ========================================================================================

-- ==========================================
-- 1. REVOKE WRITE ACCESS FROM FRONTEND
-- ==========================================
-- Disallow inserting, updating, or deleting directly from the client.
-- All writes must now go through Edge Functions using the service_role key.

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Ensure service_role can still do everything
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Allow read access based on RLS (RLS policies will further filter this)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- ==========================================
-- 2. REVOKE SENSITIVE RPC ACCESS
-- ==========================================

-- Revoke execute on billing and logging from public/frontend clients
REVOKE EXECUTE ON FUNCTION public.increment_subscription_usage(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;

-- Ensure ONLY service_role can execute sensitive functions
GRANT EXECUTE ON FUNCTION public.increment_subscription_usage(UUID, TEXT, INTEGER) TO service_role;

-- Fix previously created functions (such as log_property_view and log_admin_action)
REVOKE EXECUTE ON FUNCTION public.log_property_view(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_property_view(UUID, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, UUID, TEXT, JSONB) TO service_role;

-- ==========================================
-- 3. ENSURE STRICT RLS
-- ==========================================

-- All tables must have RLS. We reaffirm this.
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', row.tablename);
    END LOOP;
END;
$$;

-- By default, if there are no INSERT/UPDATE/DELETE policies, RLS denies them anyway.
-- However, we previously had INSERT/UPDATE/DELETE policies.
-- We must DROP any policies that allowed authenticated users to INSERT/UPDATE/DELETE,
-- or simply rely on the REVOKE statement above (REVOKE overrides RLS ALLOWs).
-- Using REVOKE is the strongest mechanism, ensuring the frontend role mathematically cannot write.

-- ==========================================
-- 4. READ-ONLY POLICIES
-- ==========================================
-- Just ensuring our core read policies are solid, no changes strictly needed if they already only ALLOW SELECT.
-- The previous schema used:
-- CREATE POLICY "Public can view valid profiles" ON public.profiles FOR SELECT USING (...);
-- Which aligns perfectly with this new architecture.
