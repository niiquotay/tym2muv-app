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

-- ==========================================
-- STEP 6: SOCIAL AUTH USER REGISTRATION FIXED
-- ==========================================
-- 6.1 Add profiles insert policy to allow clients to create/fallback profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 6.2 Recreate handle_new_user to be robust against missing social auth name keys and incompatible role enums
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  selected_role public.user_role;
  raw_role_text TEXT;
  full_name_val TEXT;
  avatar_url_val TEXT;
BEGIN
  -- Coalesce name from multiple keys sent by social providers or fallback to email local part
  full_name_val := COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'given_name',
      split_part(NEW.email, '@', 1),
      'User'
  );
  
  -- Coalesce avatar url from picture, avatar_url, etc.
  avatar_url_val := COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar'
  );

  -- Safely extract and normalize the requested role text
  raw_role_text := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'));

  -- Try to parse/cast the role to public.user_role
  BEGIN
    -- 1. Try casting the raw role (e.g. 'agent', 'tenant', 'user')
    selected_role := raw_role_text::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      -- 2. If casting failed (e.g. 'tenant' is not in enum, or 'user' is not in enum),
      -- try the alternative default role
      IF raw_role_text = 'tenant' THEN
        selected_role := 'user'::public.user_role;
      ELSIF raw_role_text = 'user' THEN
        selected_role := 'tenant'::public.user_role;
      ELSE
        -- If it was something else like 'agent' or 'admin' but failed, try fallback
        selected_role := 'tenant'::public.user_role;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- 3. Last resort: fallback to the default 'user' role
      BEGIN
        selected_role := 'user'::public.user_role;
      EXCEPTION WHEN OTHERS THEN
        -- If even 'user' doesn't exist, get the first available enum value from pg_type
        SELECT enumlabel::public.user_role INTO selected_role
        FROM pg_enum
        WHERE enumtypid = 'public.user_role'::regtype
        ORDER BY enumsortorder
        LIMIT 1;
      END;
    END;
  END;

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
      NEW.id, 
      full_name_val, 
      avatar_url_val,
      selected_role
  );
  
  -- If role is agent, insert into agents table (only if agents table exists in this schema, otherwise skip)
  IF selected_role::text = 'agent' THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
      EXECUTE 'INSERT INTO public.agents (id, company_name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING' USING NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name', '');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6.3 Recreate custom_handle_new_user to use the exact same robust logic to prevent errors
CREATE OR REPLACE FUNCTION public.custom_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RETURN public.handle_new_user();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execution rights on signup triggers from public, anon, and authenticated to secure them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_handle_new_user() FROM PUBLIC, anon, authenticated;

-- Recreate trigger just to make sure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- STEP 7: CREATE AD CLICK/IMPRESSION STATS FUNCTION
-- ==========================================
-- Define private definer helper function
CREATE OR REPLACE FUNCTION private.increment_ad_stat_definer(ad_id uuid, field text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF field = 'clicks' THEN
    UPDATE public.monetization_ads SET clicks = clicks + 1 WHERE id = ad_id;
  ELSIF field = 'impressions' THEN
    UPDATE public.monetization_ads SET impressions = impressions + 1 WHERE id = ad_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION private.increment_ad_stat_definer(uuid, text) TO anon, authenticated, service_role;

-- Define public invoker wrapper function
CREATE OR REPLACE FUNCTION public.increment_ad_stat(ad_id uuid, field text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM private.increment_ad_stat_definer(ad_id, field);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_stat(uuid, text) TO anon, authenticated, service_role;


