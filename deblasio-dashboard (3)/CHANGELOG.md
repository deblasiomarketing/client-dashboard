# Changelog

## Phase 1 — Foundation

### Built
- Next.js 14 App Router project scaffold (TypeScript, Tailwind)
- Route groups `(agency)` and `(client)` with role-aware root layouts
- Supabase server client, browser client, and isolated service-role client
- Session resolution (`getAppSession`, `requireAgencyRole`,
  `requireClientAccess`) — role/client access always derived server-side
  from the database, never trusted from the client
- Middleware enforcing agency-shell vs. client-shell routing
- Role-based navigation config shared by both shells
- Agency Dashboard shell: Attention Required (overdue deliverables) +
  monthly metric cards
- Client Overview shell: current services, performance snapshot
  (placeholders pending Phase 8 analytics sync), recent client-visible
  activity
- Login page (Supabase email/password)
- Seed script: 1 agency, 4 role-covering agency users, demo client
  "Cape Shore Glass," services, client_services scope, mixed-status
  deliverables (including one intentionally overdue), client-visible
  activity events

### Database changes
- `0001_init.sql`: agencies, profiles, agency_users, clients, client_users,
  client_assignments, services, client_services, campaigns, deliverables,
  tasks, comments, approvals, activity_events, files, notifications
- `0002_rls.sql`: `auth.agency_id_for_user()`, `auth.agency_role_for_user()`,
  `auth.client_ids_for_user()`, `auth.assigned_client_ids_for_user()`,
  RLS enabled + policies on every table above

### New environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server/seed only)
- `RESEND_API_KEY` (not yet used — reserved for Phase 10 notifications)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (not yet used — reserved for
  Phase 8 GA4/Search Console)
- `APP_URL`

### Security / RLS notes
- Every table has RLS enabled; there are no tables relying on
  application-layer filtering alone
- Client-visible content is gated by `client_visible` (deliverables,
  activity_events, files) or a `visibility` enum (comments) enforced at the
  policy level, not just hidden in the UI
- `tasks` is treated as fully internal — client policies grant no SELECT on
  it at all; client-visible progress surfaces through `deliverables` instead
- Service-role key usage is confined to `createServiceRoleClient()` (throws
  if imported into a browser bundle) and the seed script

### Still requires configuration
- A real Supabase project — migrations have not been applied anywhere yet
- Vercel project + env vars
- Resend account (for later phases)
- Google OAuth client for GA4/Search Console (Phase 8)

### Next recommended phase
Phase 2 (spec §62): Client management screens (create/edit/archive client,
service assignment UI, client_assignments management) on top of the schema
already in place.

## Phase 2 — Client Management

### Built
- Clients list page (`/clients`) — table with status badges, links into
  each client's detail page
- New Client form (`/clients/new`) — Zod-validated Server Action, admin/AM
  only per spec §3
- Client detail page (`/clients/[id]`):
  - Full client info display
  - Pause / Reactivate / Archive controls
  - Edit link → `/clients/[id]/edit`, reuses the same form component
  - Services section: view assigned services + add a new one with a
    monthly-unit scope
  - Assigned Team section (agency_admin only): checkbox-based staff
    assignment, backed by `client_assignments`
  - Client Portal Access section: create a real client login (Supabase
    Auth user + profile + client_users link) directly from the client
    page, using the service-role client in a trusted server action —
    shows the one-time temp password once, since email delivery (Resend)
    isn't wired up yet

### Database changes
- None — Phase 2 works entirely on the schema from `0001_init.sql` /
  `0002_rls.sql`. No new migration needed.

### New environment variables
- None

### Security / RLS notes
- All new mutations go through `requireAgencyRole()` before touching the
  DB, in addition to RLS — matches the "server-side authorization checks"
  requirement in spec §65
- Client-login provisioning is the one legitimate service-role use case
  outside the seed script; it's gated behind the same role check as every
  other write here, and the service-role client still never reaches the
  browser

### Still requires configuration
- Resend, so invited client users can get their credentials by email
  instead of the agency admin manually relaying them

### Next recommended phase
Phase 3 (spec §62): Deliverables, Tasks, Production Dashboard, My Tasks.
