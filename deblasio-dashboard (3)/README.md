# DeBlasio Marketing Dashboard

Agency operations dashboard + client-facing marketing portal for DeBlasio
New Media Marketing. See `ARCHITECTURE.md` for the system design and the
original master spec for full product scope.

## Status: Phase 1 (foundation) scaffolded

Built so far:

- Next.js App Router shell with two route groups: `(agency)` and `(client)`
- Supabase server/browser clients (anon-key only; service-role key is
  isolated to `createServiceRoleClient()` and the seed script)
- Auth session resolution (`src/lib/auth/session.ts`) that derives role and
  client access from the database on every request
- Middleware enforcing the agency-shell vs. client-shell split
- Core schema migration (`supabase/migrations/0001_init.sql`) covering
  agencies, profiles, roles, clients, services, campaigns, deliverables,
  tasks, comments, approvals, activity events, files, notifications
- Full RLS policy set (`supabase/migrations/0002_rls.sql`) — every table
  has RLS enabled, no exceptions
- Role-based navigation config (`src/lib/nav/config.ts`)
- Agency Dashboard shell (Attention Required + monthly metrics)
- Client Overview shell (services, performance snapshot, activity feed)
- Login page
- Seed script for the "Cape Shore Glass" demo client (spec §70)

Not yet built (later phases per spec §62): SEO module, AI Search module,
Website Work module, GA4/Search Console sync, reporting, notifications UI.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase project values
# Apply migrations to your Supabase project (via SQL editor or the CLI):
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_rls.sql
npm run seed                 # requires SUPABASE_SERVICE_ROLE_KEY locally
npm run dev
```

Demo logins after seeding (password `DevPassword123!`):

| Role | Email |
|---|---|
| Agency Admin | admin@deblasio.demo |
| Account Manager | am@deblasio.demo |
| SEO / AI Team | seo@deblasio.demo |
| Web Team | web@deblasio.demo |
| Client (Cape Shore Glass) | dana@capeshoreglass.demo |

## Verifying Phase 1 before moving to Phase 2

Per the spec's own instruction (§75), confirm before building further:

- [ ] Agency staff can log in and land on `/dashboard`
- [ ] Client contact can log in and land on `/overview`
- [ ] Agency nav items match role (e.g. only `agency_admin` sees Settings)
- [ ] A second agency's data is never visible (create a second agency + user
      manually and confirm cross-agency isolation)
- [ ] Cape Shore Glass's client user cannot query another client's rows
      (try it directly against the Supabase REST endpoint with their JWT,
      not just through the UI)
- [ ] Deploys cleanly to Vercel with the env vars in `.env.example`

## Environment variables

See `.env.example`. None of these are committed; `SUPABASE_SERVICE_ROLE_KEY`
must only ever be set in server/CI environments, never exposed to the
browser bundle.
