# TYM2MUV: Supabase Architecture & Database Design

This document outlines the complete database schema, security rules, and architectural guidelines for migrating/building the TYM2MUV platform using Next.js and Supabase.

## 1. System Architecture

**Frontend:** Next.js (App Router recommended), deploying to Vercel. Contains UI components, routing, and client-side Supabase interactions.
**Backend / Database:** Supabase (PostgreSQL). Handles Data Persistence, Authentication, Storage (images), and Realtime subscriptions.
**Authentication:** Supabase Auth (Email/Password, OAuth, OTP).
**Storage:** Supabase Storage buckets for property images and user avatars.

### Business Flows:
- **User Registration:** Uses Supabase Auth, triggers auto-creation of an entry in the `profiles` table.
- **Property Listing (Agents):** Authenticated users with the `agent` role can insert records into `properties` and upload to the `property_images` bucket.
- **Property Search (Tenants):** Public/Authenticated users query `properties` (leveraging full-text search and filtering on location/price indexes).
- **Rental Request (Tenants):** Tenants insert records into `rental_requests` linking to a property.
- **Monthly Payment Tracking:** Ledgers in `payment_plans` and integrations with payment gateways acting on webhooks to update statuses.

## 2. ER Diagram Explanation

- **`profiles`**: Central user table (1:1 with `auth.users`). Holds `role` (admin, agent, tenant) and contact details.
- **`properties`**: The core listing table. Has a structural 1:N relationship with `property_images` and 1:N with `rental_requests`.
- **`rental_requests`**: Connects a `profile` (tenant) to a `property`. Tracks application status.
- **`payment_plans`**: Tracks monthly payment obligations tied to an approved `rental_request` or `rental_agreement`.
- **`saved_properties`**: Many-to-Many relationship table mapping `profiles` to `properties` for wishlisting.
- **`messages` / `inquiries`**: 1:N from `profiles` to `properties` for questions/chat functionality between user and agent.

## 3 & 4. Complete Database Schema & SQL Scripts

Copy and paste the following directly into your Supabase SQL Editor.

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS & AUTH
-- ==========================================

-- Custom Types
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'tenant');
CREATE TYPE listing_status AS ENUM ('available', 'pending', 'rented', 'archived');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Profiles Table (Extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'tenant',
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. PROPERTY MANAGEMENT
-- ==========================================

CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL,
    price_per_month NUMERIC(10, 2) NOT NULL,
    location_text TEXT NOT NULL,
    city TEXT,
    country TEXT,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area_sqm NUMERIC,
    status listing_status DEFAULT 'available',
    amenities JSONB DEFAULT '[]'::jsonb, -- e.g., ["wifi", "parking", "pool"]
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. RENTAL SYSTEM
-- ==========================================

CREATE TABLE rental_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending',
    message TEXT,
    move_in_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_request_id UUID REFERENCES rental_requests(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount_due NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ENGAGEMENT SYSTEM
-- ==========================================

CREATE TABLE saved_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, property_id)
);

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
-- TRIGGERS FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_properties_modtime BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rental_requests_modtime BEFORE UPDATE ON rental_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payment_plans_modtime BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- USER AUTO-CREATION ON SIGN UP
-- ==========================================
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 5. RLS Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all (for public agent profiles), but only update their own.
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: Viewable by everyone. Agents insert/update their own.
CREATE POLICY "Properties viewable by everyone" ON properties FOR SELECT USING (true);
CREATE POLICY "Agents can insert properties" ON properties FOR INSERT WITH CHECK (
    auth.uid() = agent_id AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('agent', 'admin')
);
CREATE POLICY "Agents can update own properties" ON properties FOR UPDATE USING (
    auth.uid() = agent_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Agents can delete own properties" ON properties FOR DELETE USING (
    auth.uid() = agent_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Property Images: Viewable by everyone. Modifiable by the property owner.
CREATE POLICY "Property images viewable by everyone" ON property_images FOR SELECT USING (true);
CREATE POLICY "Agents can manage images for their properties" ON property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_images.property_id AND agent_id = auth.uid())
);

-- Rental Requests: Tenants see their own requests. Agents see requests for their properties.
CREATE POLICY "Users view own requests and agents view property requests" ON rental_requests FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM properties WHERE id = rental_requests.property_id AND agent_id = auth.uid())
);
CREATE POLICY "Tenants can create requests" ON rental_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Tenants update own requests, Agents update property requests" ON rental_requests FOR UPDATE USING (
     auth.uid() = tenant_id OR 
     EXISTS (SELECT 1 FROM properties WHERE id = rental_requests.property_id AND agent_id = auth.uid())
);

-- Saved Properties: Private to the tenant.
CREATE POLICY "Users manage own saved properties" ON saved_properties FOR ALL USING (auth.uid() = tenant_id);

-- Messages: Users can see messages where they are sender or receiver
CREATE POLICY "Users see their messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received messages (e.g. read status)" ON messages FOR UPDATE USING (auth.uid() = receiver_id);
```

## 6. Performance Optimization & Indexes

```sql
-- Indexes for faster querying
CREATE INDEX idx_properties_location ON properties (city, country);
CREATE INDEX idx_properties_price ON properties (price_per_month);
CREATE INDEX idx_properties_status ON properties (status);
CREATE INDEX idx_properties_type ON properties (property_type);

-- Trigram index for fuzzy text search on title & location (Requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_properties_search ON properties USING GIN (
  (title || ' ' || location_text || ' ' || COALESCE(description, '')) gin_trgm_ops
);
```

## 7. Next.js Integration Code Examples

### Setup Supabase Client (`/utils/supabase/client.ts`)
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Fetch Properties with Filters (Server Component)
```tsx
import { createClient } from '@/utils/supabase/server'

export default async function PropertyListings({ searchParams }) {
  const supabase = createClient();
  let query = supabase.from('properties').select('*, property_images(storage_path)').eq('status', 'available');

  if (searchParams.city) query = query.ilike('city', `%${searchParams.city}%`);
  if (searchParams.maxPrice) query = query.lte('price_per_month', searchParams.maxPrice);

  const { data: properties, error } = await query;

  if (error) return <div>Error loading properties.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {properties.map(p => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  )
}
```

### Submit Rental Request (Client Component)
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export function RequestRentalButton({ propertyId, tenantId }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleRequest = async () => {
    setLoading(true);
    const { error } = await supabase.from('rental_requests').insert({
      property_id: propertyId,
      tenant_id: tenantId,
      status: 'pending'
    });
    setLoading(false);
    if (!error) alert('Request submitted successfully!');
  }

  return <button onClick={handleRequest} disabled={loading}>Apply for Rental</button>
}
```

## 8. Scaling Recommendations

1. **Storage Setup:** Create a bucket named `property_assets`. Set it to "Public" so you can use `supabase.storage.from('property_assets').getPublicUrl(path)` easily without signed URLs for cover photos.
2. **Postgres Functions (RPC):** For complex aggregation (e.g., getting agent dashboard stats like total unread messages, pending requests, and total active listings), write a Postgres Function (`CREATE FUNCTION get_agent_stats(uid UUID) RETURNS json`) and call it via `.rpc('get_agent_stats', { uid })`. This reduces round-trips.
3. **Caching:** In Next.js, leverage App Router's data cache (`next: { revalidate: 3600 }`) for public property query routes to reduce database load.

## 9. Future AI Feature Readiness

By using a `JSONB` column for `amenities` and a highly structured PG database layout, we are ready for:
- **Vector Embeddings Use Case:** You can add `pgvector` to Supabase (`CREATE EXTENSION vector;`) to store natural language embeddings of the `description` + `amenities`.
- Enable a semantic search bar: *"A quiet 2 bedroom apartment in Accra with good wifi for remote work."* 
- The integration involves calling OpenAI/Gemini to embed the query, then executing a supabase `.rpc('match_properties', { query_embedding: embedding })`.
