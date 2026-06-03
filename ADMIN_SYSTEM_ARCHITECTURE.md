# TYM2MUV Admin System Architecture & Implementation

This document outlines the full production-ready admin dashboard architecture, schema, security policies, and backend logic for the TYM2MUV real estate platform using Supabase.

## 1. Admin Dashboard Architecture & Routing

The admin system is isolated from the main user-facing application. Under a standard Next.js (or Vite + React Router) structure, the `/admin` route is composed of an Admin Layout and sub-pages for specific management domains.

**Page Structure:**
- `/admin` -> Redirects to `/admin/overview`
- `/admin/layout.tsx` -> Main Admin layout wrapper (sidebar, top nav, authentication boundary)
- `/admin/overview/page.tsx` -> `Admin Overview Dashboard` (stats, charts)
- `/admin/properties/page.tsx` -> `Property Management` (approve, reject, view)
- `/admin/users/page.tsx` -> `User Management` (tenants list, blocking)
- `/admin/agents/page.tsx` -> `Agent Management` (verification, performance)
- `/admin/rentals/page.tsx` -> `Rental Management` (lifecycle tracking)
- `/admin/payments/page.tsx` -> `Payments` (ledger tracking structure)
- `/admin/reports/page.tsx` -> `Messages & Reports` (abuse flags, moderation)
- `/admin/analytics/page.tsx` -> `Analytics Dashboard` (conversion rates, demand insights)
- `/admin/logs/page.tsx` -> `System Logs` (audit trails)
- `/admin/settings/page.tsx` -> `System Settings` (platform config, maintenance mode)

## 2. Supabase Schema Additions

To support the admin system, the database requires specific tables for auditing, reporting, and settings, while leveraging the existing core tables (`profiles`, `properties`, etc.).

### New Tables:
1. **`admin_logs`**: Tracks every action an admin takes (who, what, when, against which entity).
2. **`reports`**: Allows users to report properties or other users, providing a moderation queue for admins.
3. **`system_settings`**: Key-value pair configuration for platform-wide toggles (e.g., maintenance mode).
4. **`platform_analytics`**: Aggregated material views or tables to store daily/weekly snapshots of growth metrics.

### Modified Tables:
- **`profiles`**: Must ensure a `role` enum that includes `admin` and `super_admin`.

## 3. RLS Security Policies (Zero-Trust)

Admin data access is strictly controlled.
- **Rule 1**: Only authenticated users with `role = 'admin'` or `'super_admin'` can perform CRUD operations on `admin_logs`, `system_settings`, or view full datasets without standard tenant/agent restrictions.
- **Rule 2**: `admin_logs` are insert-only for admins and system triggers.
- **Rule 3**: Row Level Security explicitly denies non-admins from querying admin tables.

*See the attached SQL script for exact policy definitions.*

## 4. Admin Backend Functions & Logic

The backend logic leverages Supabase Remote Procedure Calls (RPCs) and server actions to ensure operations are secure.

- **`approve_property(property_id)`**: Admin marks a property as 'available'. Updates `properties` table and logs action in `admin_logs`.
- **`verify_agent(agent_id)`**: Admin marks an agent profile as verified. Updates `profiles` and logs action.
- **`suspend_user(user_id)`**: Admin blocks a tenant/agent.
- **`get_platform_stats()`**: An RPC that efficiently counts active users, properties, and rentals without pulling all rows to the client.

## 5. Audit Logging System

Every critical admin function must wrap its business logic with an insert into the `admin_logs` table.

```typescript
// Example Backend Function
export async function approvePropertyAsAdmin(adminId: string, propertyId: string) {
  // 1. Verify admin role
  
  // 2. Update property status
  const { error } = await supabase
    .from('properties')
    .update({ status: 'available' })
    .eq('id', propertyId);
    
  if (!error) {
    // 3. Log the action
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action_type: 'APPROVE_PROPERTY',
      target_entity: 'properties',
      target_id: propertyId,
      details: { timestamp: new Date().toISOString() }
    });
  }
}
```

## 6. Analytics Data Structure

The platform uses aggregated material views (or scheduled RPCs) to build fast analytics dashboards.
- **Property Views**: Tracked in a `property_views` table (property_id, viewer_id, created_at).
- **Conversions**: Calculated by comparing the number of views a property gets against the number of `rental_requests` created.
- **Growth Metrics**: Scheduled pg_cron jobs that snapshot user counts daily into a `platform_analytics_snapshots` table.

## 7. Integration Guide with Existing App

1. **Authentication Boundary**: Wrap the entire `/admin/*` sub-router in an `AdminProtectedRoute` component that checks the Supabase session's `user.app_metadata.role`.
2. **Database Migration**: Execute the `supabase_admin_schema.sql` script in the Supabase SQL editor.
3. **Frontend API**: Create a dedicated `lib/supabase/admin.ts` client that is used exclusively by the admin dashboard. This client does not expose admin RPCs to the public client bundle.
4. **Gradual Refactoring**: Replace existing logic in `pages/AdminDashboard.tsx` with this modular structure, moving each tab into its own dedicated route for better code splitting and performance.
