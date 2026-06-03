-- ==========================================
-- TYM2MUV MASTER PRODUCTION DATABASE SCHEMA
-- Target: Supabase PostgreSQL
-- ==========================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- 1. ENUMS (Lifecycle States & Roles)
-- ==========================================
CREATE TYPE user_role AS ENUM ('tenant', 'agent', 'admin', 'super_admin');
CREATE TYPE property_lifecycle AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'rented');
CREATE TYPE request_lifecycle AS ENUM ('pending', 'approved', 'active', 'completed', 'cancelled');
CREATE TYPE payment_lifecycle AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- Profiles (Extends auth.users, applies to ALL users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'tenant',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (Detailed profile for agents)
CREATE TABLE agents (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    company_name TEXT,
    company_registration TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    performance_rating NUMERIC(3, 2) DEFAULT 0.00,
    total_listings INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL, -- e.g., Apartment, House, Studio
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

-- Property Images
CREATE TABLE property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Properties (Favorites)
CREATE TABLE saved_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, property_id)
);

-- ==========================================
-- 3. RENTAL BUSINESS LOGIC
-- ==========================================

-- Rental Requests
CREATE TABLE rental_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status request_lifecycle DEFAULT 'pending',
    proposed_move_in DATE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rental Agreements (Active Contracts)
CREATE TABLE rental_agreements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES rental_requests(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    agreed_price_per_month NUMERIC(10, 2) NOT NULL,
    status request_lifecycle DEFAULT 'active',
    contract_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Plans (Monthly Rent Tracking)
CREATE TABLE payment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agreement_id UUID REFERENCES rental_agreements(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount_due NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_lifecycle DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. COMMUNICATION & MESSAGING
-- ==========================================

-- Messages
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. ADMIN, REPORTS, & SYSTEM
-- ==========================================

-- Reports (Abuse/Fraud)
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('property', 'user', 'message')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'open',
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Logs (Audit Trail)
CREATE TABLE admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. TRIGGERS (Auto Updated_At)
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prof_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_agent_modtime BEFORE UPDATE ON agents FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_prop_modtime BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_req_modtime BEFORE UPDATE ON rental_requests FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_agr_modtime BEFORE UPDATE ON rental_agreements FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_pay_modtime BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_sys_modtime BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Auto-insert into profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
      NEW.id, 
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'avatar_url',
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant')
  );
  -- If role is agent, insert into agents table
  IF NEW.raw_user_meta_data->>'role' = 'agent' THEN
      INSERT INTO public.agents (id, company_name)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'company_name');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ONLY RUN ONCE IF NOT EXISTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 7. PERFORMANCE OPTIMIZATION (INDEXES)
-- ==========================================
-- Properties Indexing
CREATE INDEX idx_props_agent ON properties (agent_id);
CREATE INDEX idx_props_status ON properties (status);
CREATE INDEX idx_props_price ON properties (price_per_month);
CREATE INDEX idx_props_city ON properties (city);
CREATE INDEX idx_props_type ON properties (property_type);

-- Fast text search using Trigraph logic
CREATE INDEX idx_props_search ON properties USING GIN (
  (title || ' ' || city || ' ' || location_text) gin_trgm_ops
);

-- Relational indexes
CREATE INDEX idx_images_prop ON property_images (property_id);
CREATE INDEX idx_reqs_tenant ON rental_requests (tenant_id);
CREATE INDEX idx_reqs_prop ON rental_requests (property_id);
CREATE INDEX idx_agreements_tenant ON rental_agreements (tenant_id);
CREATE INDEX idx_agreements_agent ON rental_agreements (agent_id);
CREATE INDEX idx_pays_tenant ON payment_plans (tenant_id);
CREATE INDEX idx_msgs_participants ON messages (sender_id, receiver_id);

-- ==========================================
-- 8. ZERO-TRUST SECURITY (RLS POLICIES)
-- ==========================================

-- Enable Row Level Security globally
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Security Helper Functions
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 8.1 PROFILES & AGENTS
CREATE POLICY "Public can view non-blocked profiles" ON profiles FOR SELECT USING (is_blocked = false OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Agents can update own profile" ON agents FOR UPDATE USING (auth.uid() = id);

-- 8.2 PROPERTIES & IMAGES
CREATE POLICY "Public sees approved properties" ON properties FOR SELECT USING (status = 'approved' OR is_admin() OR auth.uid() = agent_id);
CREATE POLICY "Agents insert properties" ON properties FOR INSERT WITH CHECK (auth.uid() = agent_id AND get_user_role() = 'agent');
CREATE POLICY "Agents modify own properties" ON properties FOR UPDATE USING (auth.uid() = agent_id OR is_admin());
CREATE POLICY "Agents delete own properties" ON properties FOR DELETE USING (auth.uid() = agent_id OR is_admin());

CREATE POLICY "Public sees property images" ON property_images FOR SELECT USING (true);
CREATE POLICY "Agents manage images of own properties" ON property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_images.property_id AND agent_id = auth.uid()) OR is_admin()
);

-- 8.3 RENTALS & PAYMENTS
CREATE POLICY "Users see own saved props" ON saved_properties FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenants create requests" ON rental_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Tenants and Agents view requests" ON rental_requests FOR SELECT USING (
    auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Agents update requests" ON rental_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()) OR is_admin()
);

CREATE POLICY "Tenants and Agents view agreements" ON rental_agreements FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id OR is_admin());
CREATE POLICY "Tenants view own payments" ON payment_plans FOR SELECT USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM rental_agreements WHERE id = agreement_id AND agent_id = auth.uid()) OR is_admin());

-- 8.4 MESSAGING
CREATE POLICY "Users view participant messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR is_admin());
CREATE POLICY "Users send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users mark messages as read" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 8.5 ADMIN SYSTEM (REPORTS, LOGS, SETTINGS)
CREATE POLICY "Users insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users see own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id OR is_admin());
CREATE POLICY "Admins manage reports" ON reports FOR ALL USING (is_admin());

CREATE POLICY "Admins read logs" ON admin_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins insert logs" ON admin_logs FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins read settings" ON system_settings FOR SELECT USING (is_admin());
CREATE POLICY "Admins write settings" ON system_settings FOR ALL USING (is_admin());
