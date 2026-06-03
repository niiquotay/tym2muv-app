# TYM2MUV Production Hardening Report & Supabase Audit

This document fulfills the requirements for the production hardening of the TYM2MUV real estate rental MVP.

## STEP 1 — SYSTEM AUDIT AND GAP ANALYSIS

1. **Current Backend & Database Patterns:** 
   - The current MVP uses a mix of Firebase for authentication and mock data for listings (`mockData.ts`).
   - *Gap:* The Next.js frontend has no real relational backend for transactional rental requests, payment ledger, or agent management.
2. **Current Authentication Flow:** 
   - Uses Email/Password and Phone Auth (via Firebase currently but transitioning logically to Supabase Auth mapping to a `profiles` table).
   - *Gap:* Role-based access control (RBAC) is minimal. Needs a robust distinction between `admin`, `agent`, and `tenant`.
3. **Data Models Implied by UI:** 
   - Properties, Users, Appointments/Chats, Transactions.
   - *Gap:* Missing strict relational integrity (Foreign Keys, cascading deletes) to prevent orphaned data.
4. **Missing Backend Structures:** 
   - Complex lifecycle states (pending, active, completed) for rental agreements.
   - Monthly payment tracking (ledgers).
5. **Security Weaknesses:** 
   - Lack of Row Level Security (RLS) policies.
   - No protection against agents modifying other agents' listings.
6. **Performance Bottlenecks:** 
   - Frontend mock data filtering won't scale. Needs backend PostgreSQL indices (B-tree on categories, GIN on text search).

---

## STEP 2 — DATABASE IMPROVEMENTS (CORE TABLES)

We are formalizing the schema into 3rd Normal Form for production.

1. **`profiles`** - Extends `auth.users` with `role` and verification status.
2. **`properties`** - Hard links to `profiles` as agents.
3. **`property_images`** - Normalizes images away from properties array.
4. **`rental_requests`** - Core business logic holding lifecycle states.
5. **`rental_agreements` & `payment_plans`** - Ensures proper recurring monthly ledgers.
6. **`saved_properties`** & **`messages`** - User engagement structures.
7. **`admin_logs`** - Audit trailing for scalable operations.

---

## STEP 3 — SECURITY (RLS & RBAC)

Enabling pure zero-trust Row Level Security (RLS) in PostgreSQL.
- **Tenants:** Read public properties, access own interactions (`sender_id = auth.uid()`).
- **Agents:** Create properties, read/update/delete `properties` where `agent_id = auth.uid()`.
- **Admins:** Global permissions via `auth.jwt() ->> 'role'` or an admin boolean in `profiles`.

---

## STEP 4 — PERFORMANCE OPTIMIZATION

- **Indexing:** Creating specific PostgreSQL indexes for `location_city`, `price_per_month`, `property_type`, and `status`.
- **Pagination:** Utilizing Supabase's `range(start, end)` instead of loading massive arrays into client memory.
- **Search:** Enabling `pg_trgm` (trigram) indexing for typo-tolerant property search directly in the database.

---

## STEP 5 — RENTAL BUSINESS LOGIC (LIFECYCLE)

Implemented in `rental_requests` and `rental_agreements` tables:
- **Pending:** User requests rental.
- **Approved/Rejected:** Agent reviews request.
- **Active:** Tenant signs agreement, system generates entries in `payment_plans` using database triggers.
- **Completed/Cancelled:** Closeout state.

---

## STEP 6 — AGENT SYSTEM HARDENING

Added `is_verified` to the `profiles` table. Added `admin_logs` to ensure transparency when an admin verifies an agent. Only verified agents can push properties to `active` status.

---

## STEP 7 — STORAGE IMPROVEMENTS

Supabase Storage policies implemented.
- **Policy 1:** Anyone can view `property_images` bucket items.
- **Policy 2:** Only authenticated users matching the specific `agent_id` of the property can upload images for that property path. File-size constraints handled via Supabase dashboard size limits (e.g., 5MB).

---

## STEP 8 — REALTIME & UX DATA FLOW

Recommended configuration:
Enable Supabase Realtime for `messages` and `rental_requests`.
In frontend, subscribe via:
```typescript
supabase
  .channel('public:messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, payload => {
    // Notify user
  })
  .subscribe()
```

---

## STEP 9 — CLEAN API STRUCTURE (ABSTRACTION)

We establish an abstraction layer so UI files do not see raw SQL or Supabase direct calls. Create a `services/supabaseService.ts` to replace `mockData.ts` slowly, maintaining existing signature shapes:

```typescript
// services/supabaseService.ts
export async function getListingById(id: string) {
   const { data, error } = await supabase.from('properties').select('*, agent:profiles(*)').eq('id', id).single();
   if (error) throw error;
   return mapToFrontendType(data); // Ensures backward compatibility
}
```

---

## STEP 10 — ADMIN SYSTEM ENABLEMENT

The `admin_logs` table allows tracking of all platform overrides.
Admin dashboards will query `rpc()` (PostgreSQL Remote Procedure Calls) to get summarized counts (Total Revenue, Active Users, Pending Verifications) instead of iterating over large tables in the browser.

See `supabase_production_schema.sql` for the complete execute-ready database definition.

---

## STEP 11 — AUTHENTICATION PROTECTION & COMPROMISED PASSWORDS

To safeguard user accounts against credential stuffing and brute-force attacks, we have hardened the authentication Layer:
- **Leaked Password Protection:** Configured `config.toml` to mandate leaked password protection checking against the HaveIBeenPwned database (`leaked_passwords_enabled = true`).
- **Complexity Guidelines:** Established complex password rules demanding a combination of lowercase, uppercase, digits, and special characters.
- **Production Verification:** Ensure the setting is active in the Supabase production console: *Authentication -> Providers -> Email -> Password Security -> Enable leaked password protection*.

