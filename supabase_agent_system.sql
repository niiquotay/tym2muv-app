-- ========================================================================================
-- TYM2MUV AGENT DASHBOARD SYSTEM
-- Target Backend: Supabase PostgreSQL
-- ========================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 1: NEW TABLES FOR ANALYTICS AND TRACKING
-- ==========================================

-- 1. Property Views (Tracks individual views for analytics)
CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- STEP 2: AGENT ANALYTICS VIEW
-- ==========================================

-- 2. Agent Stats View (Aggregates performance metrics dynamically)
CREATE OR REPLACE VIEW public.agent_stats AS
SELECT 
    a.id AS agent_id,
    -- Total properties owned by the agent
    (SELECT COUNT(*) FROM public.properties p WHERE p.agent_id = a.id) AS total_properties,
    
    -- Total properties currently active/approved
    (SELECT COUNT(*) FROM public.properties p WHERE p.agent_id = a.id AND p.status = 'approved') AS active_properties,
    
    -- Total views across all properties owned by the agent
    (SELECT COUNT(*) 
     FROM public.property_views pv 
     JOIN public.properties p ON pv.property_id = p.id 
     WHERE p.agent_id = a.id) AS total_views,
     
    -- Total rental requests received across all properties owned by the agent
    (SELECT COUNT(*) 
     FROM public.rental_requests rr 
     JOIN public.properties p ON rr.property_id = p.id 
     WHERE p.agent_id = a.id) AS total_requests
FROM public.agents a;

-- ==========================================
-- STEP 3: LOGGING FUNCTIONS
-- ==========================================

-- Function to safely log a property view
CREATE OR REPLACE FUNCTION public.log_property_view(
    p_property_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.property_views (property_id, user_id, ip_address, viewed_at)
    VALUES (p_property_id, p_user_id, p_ip_address, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STEP 4: INDEXING FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_property_views_prop_id ON public.property_views (property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON public.property_views (user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views (viewed_at);

-- ==========================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Agents can see views for their own properties
DROP POLICY IF EXISTS "Agents can view stats for own properties" ON public.property_views;
CREATE POLICY "Agents can view stats for own properties" ON public.property_views
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_views.property_id AND p.agent_id = auth.uid())
    OR public.is_admin()
);

-- Anyone can insert a view
DROP POLICY IF EXISTS "Anyone can insert a view" ON public.property_views;
CREATE POLICY "Anyone can insert a view" ON public.property_views
FOR INSERT WITH CHECK (true);

-- Ensure Core Tables RLS is restricted precisely for the agent dashboard interactions

-- Properties: Agents can CRUD their own properties
-- (These policies already exist but are reiterated for completeness for the Agent scope)
-- CREATE POLICY "Agents modify own properties" ON public.properties FOR UPDATE USING (auth.uid() = agent_id OR public.is_admin());
-- CREATE POLICY "Agents delete own properties" ON public.properties FOR DELETE USING (auth.uid() = agent_id OR public.is_admin());

-- Rental Requests: Agents can view requests targeting their own properties
-- CREATE POLICY "Agents update requests" ON public.rental_requests FOR UPDATE USING (
--    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND agent_id = auth.uid()) OR public.is_admin()
-- );
