# Architecture — DeBlasio Marketing Dashboard

## 1. Tenancy model

```
agencies
  └─ agency_users (join: profiles ↔ agencies, with role)
  └─ clients
       └─ client_users (join: profiles ↔ clients)
       └─ client_services (join: clients ↔ services, scope config)
       └─ campaigns
            └─ deliverables
            └─ tasks
            └─ keyword_categories
                 └─ keywords
                      └─ keyword_rankings (append-only history)
            └─ ai_questions
                 └─ ai_checks (append-only history)
            └─ website_requests
                 └─ time_entries
       └─ activity_events
       └─ analytics_connections
            └─ analytics_metrics
       └─ reports
            └─ report_snapshots
```

Every client-owned row carries `client_id` (and transitively `agency_id`,
denormalized onto the row for cheap RLS checks and indexing — see
`supabase/migrations/0001_init.sql`).

## 2. AuthN / AuthZ

- Supabase Auth issues the session; `profiles` (1:1 with `auth.users`) holds
  display name, avatar, and a `user_type` discriminator: `agency` | `client`.
- `agency_users(profile_id, agency_id, role)` — role ∈ `agency_admin`,
  `account_manager`, `seo_ai_team`, `web_team`.
- `client_users(profile_id, client_id)` — a client user may be linked to more
  than one client (e.g. an owner of two locations), each row is a distinct
  grant, never a role escalation path.
- `client_assignments(agency_user_id, client_id)` — which internal staff are
  assigned to which clients; drives "Access assigned clients" for
  Account Manager / SEO-AI Team / Web Team roles.
- No role is ever inferred client-side. Every server action / route handler
  re-derives role + assignment from the DB using the authenticated user id,
  never from a client-supplied header, body field, or cookie claim.

## 3. Row Level Security posture

- RLS is **on** for every table from day one (`ALTER TABLE ... ENABLE ROW
  LEVEL SECURITY`, no table ships without it).
- Two helper SQL functions (`auth.agency_id_for_user()`,
  `auth.client_ids_for_user()`) centralize the membership lookups so policies
  stay simple and consistent instead of re-deriving membership per table.
- Policy shape, per table:
  - Agency staff: `agency_id = auth.agency_id_for_user()` AND (admin OR
    `client_id = ANY(assigned client ids)` for client-scoped tables).
  - Client users: `client_id = ANY(auth.client_ids_for_user())` AND
    `client_visible = true` (or the internal-only column simply doesn't
    exist on the client-facing view).
- Internal-only content (internal notes, internal comments, internal time
  estimates, profitability) is **not** filtered in the UI — it is either a
  separate table/column that client policies never grant SELECT on, or
  behind a `client_visible boolean` that the policy itself enforces. See
  §6 "Internal vs client-visible" below.
- Service-role key is used only in trusted server contexts (webhooks, cron
  sync jobs) and is never sent to the browser or imported into a Client
  Component.

## 4. Next.js layering

- App Router, two route groups: `(agency)` and `(client)`, each with its own
  root layout, nav, and middleware-enforced `user_type` guard.
- Server Components do all data fetching by default (Supabase server client
  bound to the request's cookies). Client Components are reserved for
  interactive widgets: tables with client-side sort/filter state, kanban
  drag-and-drop, comment composer, approval buttons.
- Data access is isolated in `src/lib/data/*` — route/page components call
  these functions rather than querying Supabase directly, so authorization
  assumptions live in one place and are unit-testable independent of UI.
- Mutations go through Server Actions with Zod validation before touching
  the DB; RLS is the last line of defense, not the only one.

## 5. Internal vs. client-visible content

Every content-bearing table that a client might ever see one row of also
carries the columns needed to keep the rest hidden:

- `deliverables.client_visible`, `tasks.client_visible_notes` (separate from
  `internal_notes`), `seo_work_logs.client_visible`,
  `activity_events.client_visible`, `time_entries.client_visible`,
  `comments.visibility ('internal' | 'client')`.
- Client-facing RLS policies filter on these flags at the database level.
  There is no code path where a client-scoped query can return an internal
  row and rely on the frontend to hide it.

## 6. Historical / append-only data

`keyword_rankings`, `ai_checks`, `report_snapshots`, and `seo_work_logs` are
insert-only from the app's perspective: new observations create new rows,
never UPDATE the prior observation. Enforced by (a) app code never issuing
an UPDATE to these tables, and (b) a `REVOKE UPDATE` at the DB grant level
for the app role, leaving only service-role migrations able to correct data.

## 7. What's deliberately deferred (per spec §63)

Google Ads / META / GBP integrations, automated AI-platform querying at
scale, ranking-vendor integration, billing/subscriptions, white-labeling,
and the Client Health Score are represented in the schema (nullable /
extensible) but have no working sync logic in V1.
