-- ==========================================
-- TYM2MUV PRODUCTION DATABASE SCHEMA
-- Target Backend: Supabase PostgreSQL
-- ==========================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- 1. ENUMS (Lifecycle States & Roles)
-- ==========================================
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'tenant');
CREATE TYPE property_status AS ENUM ('draft', 'available', 'rented', 'archived', 'suspended');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE agreement_status AS ENUM ('active', 'completed', 'terminated');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'failed');

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- Profiles (Tied to auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'tenant',
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    bio TEXT,
    agency_name TEXT, -- only relevant if role=agent
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    price_per_month NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    location_text TEXT NOT NULL,
    city TEXT,
    country TEXT,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area_sqm NUMERIC,
    status property_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    virtual_tour_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Amenities (Normalized)
CREATE TABLE property_amenities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenity_name TEXT NOT NULL,
    UNIQUE(property_id, amenity_name)
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

-- ==========================================
-- 3. RENTAL BUSINESS LOGIC
-- ==========================================

-- Rental Requests
CREATE TABLE rental_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending',
    proposed_move_in DATE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rental Agreements (Post-Approval)
CREATE TABLE rental_agreements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES rental_requests(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    agreed_price_per_month NUMERIC(10, 2) NOT NULL,
    status agreement_status DEFAULT 'active',
    contract_document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Plans (Monthly Tracking)
CREATE TABLE payment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agreement_id UUID REFERENCES rental_agreements(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount_due NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    transaction_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ENGAGEMENT AND MESSAGING
-- ==========================================

-- Saved Properties
CREATE TABLE saved_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, property_id)
);

-- Inquiries / Messages
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
-- 5. ADMIN SYSTEM
-- ==========================================
CREATE TABLE admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. PERFORMANCE OPTIMIZATION (INDEXES)
-- ==========================================

-- B-Tree Indexes for fast exact lookups
CREATE INDEX idx_props_agent ON properties (agent_id);
CREATE INDEX idx_props_status ON properties (status);
CREATE INDEX idx_props_price ON properties (price_per_month);
CREATE INDEX idx_props_city ON properties (city);

-- Trigram Index for fuzzy search on title and location
CREATE INDEX idx_props_fuzzy_search ON properties USING GIN (
  (title || ' ' || location_text) gin_trgm_ops
);

-- Relationship tracking indexes
CREATE INDEX idx_rental_requests_tenant ON rental_requests (tenant_id);
CREATE INDEX idx_rental_requests_prop ON rental_requests (property_id);
CREATE INDEX idx_payment_plans_tenant ON payment_plans (tenant_id);
CREATE INDEX idx_messages_participants ON messages (sender_id, receiver_id);

-- ==========================================
-- 7. ZERO-TRUST SECURITY (RLS POLICIES)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties
CREATE POLICY "Available properties viewable by public" ON properties FOR SELECT USING (status = 'available' OR auth.uid() = agent_id);
CREATE POLICY "Agents can insert properties" ON properties FOR INSERT WITH CHECK (auth.uid() = agent_id AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('agent', 'admin'));
CREATE POLICY "Agents can update own properties" ON properties FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Agents can delete own properties" ON properties FOR DELETE USING (auth.uid() = agent_id);

-- Property Images
CREATE POLICY "Property images viewable by everyone" ON property_images FOR SELECT USING (true);
CREATE POLICY "Agents manage images of own properties" ON property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_images.property_id AND agent_id = auth.uid())
);

-- Property Amenities
CREATE POLICY "Amenities viewable by everyone" ON property_amenities FOR SELECT USING (true);
CREATE POLICY "Agents manage amenities of own properties" ON property_amenities FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_amenities.property_id AND agent_id = auth.uid())
);

-- Rental Requests
CREATE POLICY "Tenants see own requests, Agents see property requests" ON rental_requests FOR SELECT USING (
    auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid())
);
CREATE POLICY "Tenants create requests" ON rental_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Tenants and Agents update requests" ON rental_requests FOR UPDATE USING (
    auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid())
);

-- Rental Agreements & Payments
CREATE POLICY "Tenants and Agents view agreements" ON rental_agreements FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id);
CREATE POLICY "Tenants and Agents view payments" ON payment_plans FOR SELECT USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM rental_agreements WHERE id = agreement_id AND agent_id = auth.uid()));

-- Engaging
CREATE POLICY "Users manage own saves" ON saved_properties FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Users see own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users mark as read" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ==========================================
-- 8. TRIGGERS (Auto Updated_At)
-- ==========================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_prof_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER trg_prop_updated BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER trg_req_updated BEFORE UPDATE ON rental_requests FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER trg_agr_updated BEFORE UPDATE ON rental_agreements FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER trg_pay_updated BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Auto Insert Profile On Auth Hook
CREATE OR REPLACE FUNCTION public.custom_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
      NEW.id, 
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'avatar_url',
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.custom_handle_new_user();
