-- ========================================================================================
-- TYM2MUV ENTERPRISE PLATFORM SCHEMA
-- Target Backend: Supabase PostgreSQL
-- Features: AI, CRM, Verification, Agreements, Real-Time Chat, Geospatial, Marketplace, Subscriptions
-- ========================================================================================

-- ==========================================
-- 0. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- For fast text search
CREATE EXTENSION IF NOT EXISTS "postgis";      -- For Smart Search & Map Experience
CREATE EXTENSION IF NOT EXISTS "vector";       -- For AI Property Matching (pgvector)

-- ==========================================
-- 1. ENUMS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('tenant', 'agent', 'admin', 'super_admin', 'vendor');
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'agency');
    CREATE TYPE property_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'suspended', 'rented');
    CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'viewing_scheduled', 'offer_made', 'won', 'lost');
    CREATE TYPE viewing_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled');
    CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'expired', 'void');
    CREATE TYPE doc_type AS ENUM ('id', 'lease', 'receipt', 'verification', 'inspection');
    CREATE TYPE service_category AS ENUM ('cleaning', 'moving', 'maintenance', 'utilities', 'furniture');
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
    CREATE TYPE comm_channel AS ENUM ('whatsapp', 'email', 'push', 'sms');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================
-- 2. CORE IDENTITY & VERIFICATION
-- ==========================================

-- Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'tenant',
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'en',               -- Multi-language Support
    affordability_score NUMERIC(5, 2),        -- AI Affordability Engine
    is_verified BOOLEAN DEFAULT false,
    fcm_token TEXT,                           -- Mobile Push Notifications
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (Includes Subscriptions & CRM metrics)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    company_name TEXT,
    verification_status TEXT DEFAULT 'pending',
    trust_score NUMERIC(5, 2) DEFAULT 0,      -- Admin Verification Trust Score
    subscription_plan subscription_tier DEFAULT 'free',
    subscription_expiry TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT false,
    bio TEXT,
    total_listings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Move-in Marketplace Vendors
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    company_name TEXT NOT NULL,
    category service_category NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    service_area geography(Polygon, 4326),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. PROPERTIES & AI SEARCH ENGINE
-- ==========================================

-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT,
    price_per_month NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'GHS',
    city TEXT,
    neighborhood TEXT,
    -- Geospatial PostGIS Point for map search
    location geography(Point, 4326), 
    bedrooms INTEGER,
    bathrooms INTEGER,
    amenities JSONB DEFAULT '[]'::jsonb,
    status property_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    
    -- AI & Fraud Attributes
    ai_fraud_score NUMERIC(5, 2),
    embedding vector(1536),                   -- OpenAI embeddings for semantic matching
    ai_generated_desc BOOLEAN DEFAULT false,
    virtual_tour_url TEXT,                    -- Video & 360 Tours
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Media
CREATE TABLE IF NOT EXISTS public.property_media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',          -- 'image' or 'video'
    is_primary BOOLEAN DEFAULT false,
    ai_tags JSONB,                            -- Tags detected by AI image analysis
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. AGENT CRM & PIPELINE
-- ==========================================

-- CRM Leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    stage lead_stage DEFAULT 'new',
    notes TEXT,
    ai_conversion_score NUMERIC(5, 2),        -- Probability of closing
    next_follow_up TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewing Scheduling
CREATE TABLE IF NOT EXISTS public.viewings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status viewing_status DEFAULT 'pending',
    check_in_qr_code TEXT,                    -- Mobile QR scanning
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. LEGAL, CONTRACTS & VAULT
-- ==========================================

-- Digital Tenancy Agreements
CREATE TABLE IF NOT EXISTS public.tenancy_agreements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,               -- PDF Storage Link
    rent_amount NUMERIC(12, 2) NOT NULL,
    status signature_status DEFAULT 'pending',
    tenant_signature_timestamp TIMESTAMPTZ,
    tenant_signature_ip TEXT,
    agent_signature_timestamp TIMESTAMPTZ,
    agent_signature_ip TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Document Vault
CREATE TABLE IF NOT EXISTS public.document_vault (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doc_type doc_type NOT NULL,
    file_url TEXT NOT NULL,                   -- Private bucket url
    is_verified BOOLEAN DEFAULT false,
    encryption_key_id TEXT,                   -- Secure encryption reference
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rent Insurance Policies
CREATE TABLE IF NOT EXISTS public.rent_insurance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    policy_number TEXT UNIQUE,
    premium_amount NUMERIC(10, 2) NOT NULL,
    coverage_amount NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. REAL-TIME CHAT & COMMUNICATIONS
-- ==========================================

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages (Supports Realtime, Offline Sync, and Media)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    attachment_url TEXT,
    attachment_type TEXT,                     -- e.g., 'image', 'audio', 'document'
    ai_flagged BOOLEAN DEFAULT false,         -- Fraud/Spam detection
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp & Communications Log
CREATE TABLE IF NOT EXISTS public.communications_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel comm_channel DEFAULT 'whatsapp',
    message_type TEXT,                        -- e.g., 'viewing_reminder', 'rent_due'
    gateway_status TEXT,                      -- e.g., 'delivered', 'failed'
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. ADS, MONETIZATION & MARKETPLACE
-- ==========================================

-- Property Ads / Boosting
CREATE TABLE IF NOT EXISTS public.property_ads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    budget NUMERIC(10, 2) NOT NULL,
    spent NUMERIC(10, 2) DEFAULT 0.00,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Bookings (Movers, Cleaners, etc.)
CREATE TABLE IF NOT EXISTS public.vendor_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    service_date TIMESTAMPTZ NOT NULL,
    status booking_status DEFAULT 'pending',
    price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. ANALYTICS & MARKET INTELLIGENCE
-- ==========================================

-- Property Price Index
CREATE TABLE IF NOT EXISTS public.market_price_index (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city TEXT NOT NULL,
    neighborhood TEXT,
    property_type TEXT NOT NULL,
    avg_price NUMERIC(12, 2),
    data_date DATE NOT NULL,
    sample_size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. PERFORMANCE INDEXING
-- ==========================================

-- Geospatial Index for Map Search
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING GIST (location);
-- Vector Index for AI Similarity Search
CREATE INDEX IF NOT EXISTS idx_properties_embedding ON public.properties USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_properties_city_hood ON public.properties (city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON public.crm_leads (agent_id, stage);
CREATE INDEX IF NOT EXISTS idx_viewings_tenant ON public.viewings (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_viewings_agent ON public.viewings (agent_id, status);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.tenancy_agreements (status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_active ON public.property_ads (is_active, starts_at);
CREATE INDEX IF NOT EXISTS idx_market_idx_date ON public.market_price_index (city, data_date);

-- ========================================================================================
-- END OF SCHEMA
-- ========================================================================================
