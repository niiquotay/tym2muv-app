# TYM2MUV Agent Dashboard Implementation Guide

This document defines the architecture, database additions, and integration guide for the Tym2muv Agent Dashboard. Note: While the prompt specifies Next.js, the existing Tym2muv MVP is built on Vite/React. The concepts and route structures below map 1:1 using React Router (or Next.js App router if migrated later).

## 1. Supabase SQL Schema Additions & RLS
We have extended the Supabase implementation established in the hardening phase to include explicit tracking for the agent.

**Additions:**
- `property_views`: Tracks user and anonymous impressions per property.
- `agent_stats` (View): Aggregates total properties, active properties, views, and generated requests without manual tallying on the client.
- `log_property_view()`: A safe, server-side function to record a view without exposing direct INSERT access insecurely.

**RLS Enforcement:**
- Agents can strictly `SELECT` from `property_views` ONLY for properties where `agent_id = auth.uid()`.
- Views automatically enforce data isolation, ensuring `agent_stats` reflects exact counts bounded by the user contexts querying the data.

*(See `supabase_agent_system.sql` for complete SQL scripts)*

---

## 2. Recommended Folder Structure (Next.js or React Router)

Create standard protected routes for the agent workspace isolated from the main tenant/public experience.

```text
src/ (or app/ in Next.js)
 └── (agent) / OR pages/agent/
      ├── layout.tsx                // Agent Dashboard secure wrapper & sidebar navigating agent links
      ├── dashboard/
      │    └── page.tsx             // Overview: Render agent_stats, quick stats, recent views
      ├── properties/
      │    ├── page.tsx             // List agent's properties
      │    ├── new/page.tsx         // Multi-step listing creation wizard
      │    └── [id]/page.tsx        // Edit property & property-specific views/conversion stats
      ├── rentals/
      │    └── page.tsx             // Track active agreements/payments assigned to this agent
      ├── requests/
      │    └── page.tsx             // Approve/reject pending `rental_requests` for owned properties
      ├── messages/
      │    └── page.tsx             // Threaded chat with users
      ├── analytics/
      │    └── page.tsx             // Deep dive charts plotting `property_views` over time
      └── profile/
           └── page.tsx             // Agent company verification upload & settings
```

---

## 3. Required Frontend Queries (Supabase SDK)

Wrap these inside server actions or custom data hooks on the frontend to power the agent dashboard.

### A. Fetch Dashboard Analytics
```typescript
// Fetch aggregate stats for the logged-in agent
const { data: stats, error } = await supabase
  .from('agent_stats')
  .select('*')
  .eq('agent_id', user.id)
  .single();
```

### B. Fetch Agent's Properties
```typescript
const { data: properties, error } = await supabase
  .from('properties')
  .select(`
    *,
    property_views ( count ),
    rental_requests ( count )
  `)
  .eq('agent_id', user.id)
  .order('created_at', { ascending: false });
```

### C. Handle Rental Requests
```typescript
// Fetch requests targeting properties owned by the agent
const { data: requests, error } = await supabase
  .from('rental_requests')
  .select(`
    *,
    property:properties (*),
    tenant:profiles (*)
  `)
  -- RLS automatically limits this down to the agent's properties, but explicitly:
  .eq('property.agent_id', user.id) 
  .order('created_at', { ascending: false });

// Approve a request transition
const approveRequest = async (requestId: string) => {
  await supabase
    .from('rental_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);
};
```

### D. Log a View (Triggered on public property page load)
```typescript
const logView = async (propertyId: string) => {
  await supabase.rpc('log_property_view', { 
    p_property_id: propertyId 
    // Uses auth context automatically or handles anonymous views
  });
};
```

---

## 4. Integration & Safe Expansion

1. **Routing Protection:** The layout/wrapper for the `/agent/*` namespace must enforce `user.role === 'agent'`. If a `tenant` attempts to reach `/agent/dashboard`, kick them back to `/` or prompt to upgrade their profile.
2. **Backward Compatibility:** No alterations were made to the core fields of `properties` or `rental_requests`, meaning old components mapping those models will continue working unchanged while the new modules consume the expanded views.
3. **Execution:** Apply `supabase_agent_system.sql` carefully alongside the earlier hardening architecture.
