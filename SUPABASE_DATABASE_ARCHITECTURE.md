# TYM2MUV Supabase Production Architecture

This document tracks the full production-ready Supabase database layer and security architecture designed to convert the TYM2MUV MVP into a fully scalable SaaS platform.

## 1. Database Architecture Overview

The system spans 12 core tables organized into logical subsystems mapping real-world business models.

### 1.1 Users & Extensibility
*   **profiles:** Extends Supabase's internal `auth.users`, ensuring the separation of auth state and application state. Holds core details like name, avatar, base `role` (`tenant`, `agent`, `admin`, `super_admin`), and whether the user is `is_blocked`.
*   **agents:** Extends `profiles` explicitly for agent-specific data (company details, verification status, performance metrics, and bio).

### 1.2 Property Management
*   **properties:** Tracks all real-estate listings. Mapped to an agent. Utilizes a lifecycle state: `pending` -> `approved` -> `rejected` -> `suspended` -> `rented`.
*   **property_images:** One-to-many relationship supporting primary ordering.
*   **saved_properties:** For tenants to maintain a wish list.

### 1.3 Real-Estate Workflows
*   **rental_requests:** Initiates a tenant's request for a property. State transitions form the core funnel. Mapped directly to tenants and properties.
*   **rental_agreements:** Once approved, request converts to an active agreement representing an executing contract logic spanning a `start_date` and `end_date`.
*   **payment_plans:** Monthly tracking system mapping to an agreement. Allows parsing due dates and separating states as `paid` or `overdue`.

### 1.4 Communications
*   **messages:** Supports 1:1 and property-specific interactions.

### 1.5 Admin Operations
*   **reports:** Abuse reports against properties, users, or messages.
*   **admin_logs:** Complete audit capability. Every admin/super_admin action creates a metadata footprint tracking specific JSON details.
*   **system_settings:** Configuration storage for maintaining globals like features toggles.

## 2. Row Level Security (RLS) Strategy

Zero-trust architecture enforces data integrity. 

*   **Role Enforcement Strategies:**
    A combination of internal SQL `STABLE` utility functions (`get_user_role()`, `is_admin()`) guarantees role assertion overrides on top of standard validation schemas.
*   **Strict Access Paths:**
    *   **Tenants:** Read exclusively `approved` statuses of properties via `.uid()`. Modify specific request funnels linked directly to their `.uid()`.
    *   **Agents:** Modify bounds mapped explicitly to `agent_id = auth.uid()`. Can strictly view specific pipeline requests targeting their property identifiers.
    *   **Public Access:** Safely guarded against `is_blocked = true` user views while opening necessary general schemas (approved property images).
    *   **Admins:** Read bounds automatically open across any data footprint (e.g., reports, payments), alongside isolated update authority across `admin_logs`.

## 3. Indexing & Query Optimizations

*   **Trigram Indexing:** Full-search performance against a composite matrix (`title || ' ' || city || ' ' || location_text`) is achieved using B-tree extensions `pg_trgm`, allowing real-time map matching strings across typos.
*   **Foreign Keys Optimization:** Every `*_id` identifier receives specific mapping structure to eliminate nested query scan latency.

## 4. Relationship Diagram Constraints (Model Map)

```text
auth.users (1) -> (1) profiles
profiles (1) -> (1) agents
agents (1) -> (M) properties
properties (1) -> (M) property_images
properties (M) <- (M) saved_properties -> (M) profiles 
profiles (1) -> (M) rental_requests <- (1) properties
rental_requests (1) -> (1) rental_agreements
rental_agreements (1) -> (M) payment_plans
profiles(1) -> (M) messages 
```

## 5. Scalability Recommendations

1.  **Read-Replicas for Dashboards:** Heavy chart aggregations for admin overviews should route to secondary reads on global databases.
2.  **Pagination:** Large array sets on UI (properties view) enforce cursor strategies avoiding memory leak vulnerabilities fetching `saved_properties` or `rental_requests`.
3.  **Storage:** Integrate `property_images` exclusively using `storage.from().getPublicUrl()`, leveraging the CDN capabilities embedded by Vercel for rapid paint distribution.
