-- ========================================================================================
-- TYM2MUV PRODUCTION HARDENING - SUPABASE MASTER SCHEMA
-- Target Backend: Supabase PostgreSQL
-- ========================================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- STEP 1: ENUMS & LIFECYCLES
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE property_lifecycle AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'rented');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_lifecycle AS ENUM ('pending', 'approved', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_lifecycle AS ENUM ('pending', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_target AS ENUM ('user', 'property', 'agent', 'message');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ad_placement AS ENUM ('card', 'banner', 'popup', 'tall');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================
-- STEP 2: CORE TABLES
-- ==========================================

-- 1. Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'user',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agents (Detailed verification & performance)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    company_name TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    performance_rating NUMERIC(3, 2) DEFAULT 0.00,
    total_listings INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Properties (Listings)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL,
    price_per_month NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    location_text TEXT NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    status property_lifecycle DEFAULT 'pending',
    amenities JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Property Images
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Properties (Favorites)
CREATE TABLE IF NOT EXISTS public.saved_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, property_id)
);

-- ==========================================
-- STEP 3: RENTAL & PAYMENT SYSTEM
-- ==========================================

-- 5. Rental Requests
CREATE TABLE IF NOT EXISTS public.rental_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status request_lifecycle DEFAULT 'pending',
    proposed_move_in DATE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Rental Agreements
CREATE TABLE IF NOT EXISTS public.rental_agreements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES public.rental_requests(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    agreed_price_per_month NUMERIC(10, 2) NOT NULL,
    status request_lifecycle DEFAULT 'active',
    contract_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payment Plans
CREATE TABLE IF NOT EXISTS public.payment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agreement_id UUID REFERENCES public.rental_agreements(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_due NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_lifecycle DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- STEP 4: ADMIN & SYSTEM TABLES
-- ==========================================

-- 9. Reports (Fraud / Abuse)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type report_target NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'open',
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Admin Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Monetization Ads
CREATE TABLE IF NOT EXISTS public.monetization_ads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    cta TEXT,
    type ad_placement DEFAULT 'card',
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    color TEXT,
    active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    country_code TEXT,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- STEP 5: SECURITY FUNCTIONS & LOGIC
-- ==========================================

-- 5.1 RBAC Helpers
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5.2 Admin Logger Function
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action_type TEXT,
    p_target_table TEXT,
    p_target_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can log admin actions.';
    END IF;

    INSERT INTO public.admin_logs (
        admin_id, action_type, target_table, target_id, description, metadata
    ) VALUES (
        auth.uid(), p_action_type, p_target_table, p_target_id, p_description, p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Auto Updated_At Triggers
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at()', t, t);
  END LOOP;
END $$;

-- ==========================================
-- STEP 6: INDEXING & PERFORMANCE
-- ==========================================

-- Properties
CREATE INDEX IF NOT EXISTS idx_props_agent ON public.properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_props_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_props_price ON public.properties (price_per_month);
CREATE INDEX IF NOT EXISTS idx_props_location ON public.properties (city, country);
CREATE INDEX IF NOT EXISTS idx_props_type ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_props_search ON public.properties USING GIN ((title || ' ' || location_text) gin_trgm_ops);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents (verification_status);

-- Rentals & Payments
CREATE INDEX IF NOT EXISTS idx_reqs_tenant ON public.rental_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reqs_status ON public.rental_requests (status);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.rental_agreements (status);
CREATE INDEX IF NOT EXISTS idx_pays_status ON public.payment_plans (status);

-- Admin
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);

-- ==========================================
-- STEP 7: ADMIN DASHBOARD METRICS VIEW
-- ==========================================
CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user') AS total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'agent') AS total_agents,
    (SELECT COUNT(*) FROM public.properties) AS total_properties,
    (SELECT COUNT(*) FROM public.rental_requests) AS total_rental_requests,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'open') AS open_reports;

-- ==========================================
-- STEP 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS globally
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_ads ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES & AGENTS
DROP POLICY IF EXISTS "Public can view valid profiles" ON public.profiles;
CREATE POLICY "Public can view valid profiles" ON public.profiles FOR SELECT USING (is_blocked = false OR public.is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view agents" ON public.agents;
CREATE POLICY "Public can view agents" ON public.agents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Agents update own profile" ON public.agents;
CREATE POLICY "Agents update own profile" ON public.agents FOR UPDATE USING (auth.uid() = id);

-- 8.2 PROPERTIES
DROP POLICY IF EXISTS "Public sees approved properties" ON public.properties;
CREATE POLICY "Public sees approved properties" ON public.properties FOR SELECT USING (status = 'approved' OR public.is_admin() OR auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents insert properties" ON public.properties;
CREATE POLICY "Agents insert properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = agent_id AND public.get_user_role() IN ('agent', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Agents modify own properties" ON public.properties;
CREATE POLICY "Agents modify own properties" ON public.properties FOR UPDATE USING (auth.uid() = agent_id OR public.is_admin());

DROP POLICY IF EXISTS "Agents delete own properties" ON public.properties;
CREATE POLICY "Agents delete own properties" ON public.properties FOR DELETE USING (auth.uid() = agent_id OR public.is_admin());

-- Images
DROP POLICY IF EXISTS "Public sees property images" ON public.property_images;
CREATE POLICY "Public sees property images" ON public.property_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Agents manage images" ON public.property_images;
CREATE POLICY "Agents manage images" ON public.property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_images.property_id AND agent_id = auth.uid()) OR public.is_admin()
);

-- 8.3 RENTALS & PAYMENTS
DROP POLICY IF EXISTS "Users manage own saves" ON public.saved_properties;
CREATE POLICY "Users manage own saves" ON public.saved_properties FOR ALL USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Tenants and Agents view requests" ON public.rental_requests;
CREATE POLICY "Tenants and Agents view requests" ON public.rental_requests FOR SELECT USING (
    auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND agent_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Tenants create requests" ON public.rental_requests;
CREATE POLICY "Tenants create requests" ON public.rental_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Agents update requests" ON public.rental_requests;
CREATE POLICY "Agents update requests" ON public.rental_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND agent_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Tenants and Agents view agreements" ON public.rental_agreements;
CREATE POLICY "Tenants and Agents view agreements" ON public.rental_agreements FOR SELECT USING (
    auth.uid() = tenant_id OR auth.uid() = agent_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Tenants view own payments" ON public.payment_plans;
CREATE POLICY "Tenants view own payments" ON public.payment_plans FOR SELECT USING (
    auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.rental_agreements WHERE id = agreement_id AND agent_id = auth.uid()) OR public.is_admin()
);

-- 8.4 MESSAGING
DROP POLICY IF EXISTS "Users view their messages" ON public.messages;
CREATE POLICY "Users view their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users mark messages read" ON public.messages;
CREATE POLICY "Users mark messages read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 8.5 ADMIN SYSTEM (REPORTS, LOGS, SETTINGS)
DROP POLICY IF EXISTS "Users create reports" ON public.reports;
CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users view own reports" ON public.reports;
CREATE POLICY "Users view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage reports" ON public.reports;
CREATE POLICY "Admins manage reports" ON public.reports FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read logs" ON public.admin_logs;
CREATE POLICY "Admins read logs" ON public.admin_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert logs" ON public.admin_logs;
CREATE POLICY "Admins insert logs" ON public.admin_logs FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins read settings" ON public.system_settings;
CREATE POLICY "Admins read settings" ON public.system_settings FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins write settings" ON public.system_settings;
CREATE POLICY "Admins write settings" ON public.system_settings FOR ALL USING (public.is_admin());

-- 8.6 MONETIZATION ADS
DROP POLICY IF EXISTS "Public can view active ads" ON public.monetization_ads;
CREATE POLICY "Public can view active ads" ON public.monetization_ads FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage ads" ON public.monetization_ads;
CREATE POLICY "Admins manage ads" ON public.monetization_ads FOR ALL USING (public.is_admin());

-- ========================================================================================
-- END OF SCRIPT
-- ========================================================================================
