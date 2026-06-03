-- Create custom claim function and trigger
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
  DECLARE
    claims jsonb;
    user_role public.app_role;
  BEGIN
    -- Fetch the user role in the profiles table
    SELECT role INTO user_role FROM public.profiles WHERE id = (event->>'user_id')::uuid;

    claims := event->'claims';
    IF user_role IS NOT NULL THEN
      -- Set the claim
      claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
    END IF;

    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    -- Return the modified or original event
    RETURN event;
  END;
$$;

-- Note: In a real project you need to configure the hook in the auth config, or just use auth.users.app_metadata trigger

-- Alternative trigger on profiles to sync role to app_metadata (works on supabase if service role is used)
-- We will use a database trigger using direct manipulation of auth.users
CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET app_metadata = jsonb_set(COALESCE(app_metadata, '{}'::jsonb), '{role}', to_jsonb(NEW.role))
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.role IS NULL)
  EXECUTE FUNCTION public.sync_role_to_app_metadata();

-- Run it once for existing profiles (if auth.users exists which it does in supabase)
DO $$
DECLARE
  profile_rec RECORD;
BEGIN
  FOR profile_rec IN SELECT id, role FROM public.profiles WHERE role IS NOT NULL
  LOOP
    UPDATE auth.users
    SET app_metadata = jsonb_set(COALESCE(app_metadata, '{}'::jsonb), '{role}', to_jsonb(profile_rec.role))
    WHERE id = profile_rec.id;
  END LOOP;
END;
$$;

-- Enforce check constraint on role column
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE public.profiles ADD CONSTRAINT valid_role CHECK (role IN ('Admin', 'Agent', 'Tenant', 'Customer'));

-- Add RLS policy for Admin on monetization_ads
ALTER TABLE monetization_ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_monetization_ads" ON monetization_ads;

CREATE POLICY "admin_only_monetization_ads" 
ON monetization_ads 
FOR ALL 
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'Admin');
