-- 0002_rls.sql
-- Row Level Security: helper functions + policies for every table created
-- in 0001_init.sql. Every later migration that adds a table must add its
-- policies in the same migration — no table ships without RLS.

-- =========================================================================
-- HELPER FUNCTIONS
-- Centralize membership lookups so policies stay short and consistent.
-- SECURITY DEFINER + fixed search_path so these can't be hijacked, but they
-- only ever read membership rows for auth.uid() — never write, never take
-- caller-supplied ids.
-- =========================================================================

create or replace function auth.agency_id_for_user()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select agency_id from agency_users where profile_id = auth.uid() limit 1;
$$;

create or replace function auth.agency_role_for_user()
returns agency_role
language sql
security definer
set search_path = public
stable
as $$
  select role from agency_users where profile_id = auth.uid() limit 1;
$$;

create or replace function auth.client_ids_for_user()
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(array_agg(client_id), '{}')
  from client_users where profile_id = auth.uid();
$$;

-- Clients an agency staff member may touch: admins get every client in
-- their agency, everyone else gets only their assigned clients.
create or replace function auth.assigned_client_ids_for_user()
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when auth.agency_role_for_user() = 'agency_admin' then
      (select coalesce(array_agg(id), '{}') from clients
       where agency_id = auth.agency_id_for_user())
    else
      (select coalesce(array_agg(ca.client_id), '{}')
       from client_assignments ca
       join agency_users au on au.id = ca.agency_user_id
       where au.profile_id = auth.uid())
  end;
$$;

create or replace function auth.is_agency_user()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from agency_users where profile_id = auth.uid());
$$;

create or replace function auth.is_client_user()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from client_users where profile_id = auth.uid());
$$;

-- =========================================================================
-- ENABLE RLS
-- =========================================================================

alter table agencies enable row level security;
alter table profiles enable row level security;
alter table agency_users enable row level security;
alter table clients enable row level security;
alter table client_users enable row level security;
alter table client_assignments enable row level security;
alter table services enable row level security;
alter table client_services enable row level security;
alter table campaigns enable row level security;
alter table deliverables enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table approvals enable row level security;
alter table activity_events enable row level security;
alter table files enable row level security;
alter table notifications enable row level security;

-- =========================================================================
-- AGENCIES / PROFILES
-- =========================================================================

create policy agencies_select on agencies for select
  using (id = auth.agency_id_for_user());

create policy profiles_select_self_or_same_org on profiles for select
  using (
    id = auth.uid()
    or (auth.is_agency_user() and exists (
          select 1 from agency_users au
          where au.profile_id = profiles.id
            and au.agency_id = auth.agency_id_for_user()))
    or (auth.is_agency_user() and exists (
          select 1 from client_users cu
          where cu.profile_id = profiles.id
            and cu.client_id = any(auth.assigned_client_ids_for_user())))
  );

create policy profiles_update_self on profiles for update
  using (id = auth.uid());

-- =========================================================================
-- AGENCY_USERS
-- =========================================================================

create policy agency_users_select on agency_users for select
  using (agency_id = auth.agency_id_for_user());

create policy agency_users_write_admin_only on agency_users for all
  using (agency_id = auth.agency_id_for_user() and auth.agency_role_for_user() = 'agency_admin')
  with check (agency_id = auth.agency_id_for_user() and auth.agency_role_for_user() = 'agency_admin');

-- =========================================================================
-- CLIENTS
-- =========================================================================

create policy clients_select_agency on clients for select
  using (
    (auth.is_agency_user() and agency_id = auth.agency_id_for_user()
      and id = any(auth.assigned_client_ids_for_user()))
    or (auth.is_client_user() and id = any(auth.client_ids_for_user()))
  );

create policy clients_write_agency_staff on clients for insert
  with check (agency_id = auth.agency_id_for_user() and auth.agency_role_for_user() in ('agency_admin','account_manager'));

create policy clients_update_agency_staff on clients for update
  using (agency_id = auth.agency_id_for_user()
    and (auth.agency_role_for_user() in ('agency_admin','account_manager')
         and id = any(auth.assigned_client_ids_for_user())));

-- Client users: read-only on their own client row (no policy for
-- insert/update/delete means those are denied by default).

-- =========================================================================
-- CLIENT_USERS / CLIENT_ASSIGNMENTS  (membership tables — agency-managed only)
-- =========================================================================

create policy client_users_select on client_users for select
  using (
    profile_id = auth.uid()
    or (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()))
  );

create policy client_users_write_agency_admin on client_users for all
  using (auth.agency_role_for_user() in ('agency_admin','account_manager')
    and exists (select 1 from clients c where c.id = client_users.client_id
                and c.agency_id = auth.agency_id_for_user()))
  with check (exists (select 1 from clients c where c.id = client_users.client_id
                and c.agency_id = auth.agency_id_for_user()));

create policy client_assignments_select on client_assignments for select
  using (exists (select 1 from clients c where c.id = client_assignments.client_id
                 and c.agency_id = auth.agency_id_for_user()));

create policy client_assignments_write_admin on client_assignments for all
  using (auth.agency_role_for_user() = 'agency_admin')
  with check (auth.agency_role_for_user() = 'agency_admin');

-- =========================================================================
-- SERVICES / CLIENT_SERVICES
-- =========================================================================

create policy services_select on services for select
  using (agency_id = auth.agency_id_for_user());

create policy services_write_admin on services for insert
  with check (agency_id = auth.agency_id_for_user() and auth.agency_role_for_user() = 'agency_admin');
create policy services_update_admin on services for update
  using (agency_id = auth.agency_id_for_user() and auth.agency_role_for_user() = 'agency_admin');

create policy client_services_select on client_services for select
  using (
    (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()))
    or (auth.is_client_user() and client_id = any(auth.client_ids_for_user()))
  );

create policy client_services_write_agency on client_services for all
  using (auth.is_agency_user() and agency_role_for_user_ok())
  with check (agency_id = auth.agency_id_for_user());

-- helper used above kept inline-safe: agency_admin/account_manager only
create or replace function agency_role_for_user_ok() returns boolean
language sql security definer set search_path = public stable as $$
  select auth.agency_role_for_user() in ('agency_admin','account_manager');
$$;

-- =========================================================================
-- CAMPAIGNS / DELIVERABLES / TASKS
-- Pattern repeats: agency staff -> assigned clients; client users -> own
-- clients + (for deliverables) client_visible = true only.
-- =========================================================================

create policy campaigns_select on campaigns for select
  using (
    (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()))
    or (auth.is_client_user() and client_id = any(auth.client_ids_for_user()))
  );
create policy campaigns_write on campaigns for all
  using (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()))
  with check (agency_id = auth.agency_id_for_user());

create policy deliverables_select_agency on deliverables for select
  using (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()));
create policy deliverables_select_client on deliverables for select
  using (auth.is_client_user() and client_id = any(auth.client_ids_for_user()) and client_visible = true);
create policy deliverables_write on deliverables for all
  using (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()))
  with check (agency_id = auth.agency_id_for_user());

create policy tasks_select_agency on tasks for select
  using (auth.is_agency_user() and (client_id is null or client_id = any(auth.assigned_client_ids_for_user())));
-- Tasks are internal-only objects; client users never read the tasks table
-- directly. Client-visible progress is surfaced via deliverables instead.
create policy tasks_write on tasks for all
  using (auth.is_agency_user() and (client_id is null or client_id = any(auth.assigned_client_ids_for_user())))
  with check (agency_id = auth.agency_id_for_user());

-- =========================================================================
-- COMMENTS / APPROVALS / ACTIVITY / FILES
-- =========================================================================

create policy comments_select_agency on comments for select
  using (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()));
create policy comments_select_client on comments for select
  using (auth.is_client_user() and client_id = any(auth.client_ids_for_user()) and visibility = 'client');
create policy comments_insert on comments for insert
  with check (
    (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()) and agency_id = auth.agency_id_for_user())
    or (auth.is_client_user() and client_id = any(auth.client_ids_for_user()) and visibility = 'client')
  );

create policy approvals_select_agency on approvals for select
  using (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()));
create policy approvals_select_client on approvals for select
  using (auth.is_client_user() and client_id = any(auth.client_ids_for_user()));
create policy approvals_write_agency on approvals for insert
  with check (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()) and agency_id = auth.agency_id_for_user());
create policy approvals_update_client_response on approvals for update
  using (auth.is_client_user() and client_id = any(auth.client_ids_for_user()));

create policy activity_select_agency on activity_events for select
  using (auth.is_agency_user() and client_id = any(auth.assigned_client_ids_for_user()));
create policy activity_select_client on activity_events for select
  using (auth.is_client_user() and client_id = any(auth.client_ids_for_user()) and client_visible = true);
create policy activity_insert_agency on activity_events for insert
  with check (agency_id = auth.agency_id_for_user());

create policy files_select_agency on files for select
  using (auth.is_agency_user() and (client_id is null or client_id = any(auth.assigned_client_ids_for_user())));
create policy files_select_client on files for select
  using (auth.is_client_user() and client_id = any(auth.client_ids_for_user()) and client_visible = true);
create policy files_insert on files for insert
  with check (
    (auth.is_agency_user() and agency_id = auth.agency_id_for_user())
    or (auth.is_client_user() and client_id = any(auth.client_ids_for_user()))
  );

-- =========================================================================
-- NOTIFICATIONS — strictly per-recipient
-- =========================================================================

create policy notifications_select_own on notifications for select
  using (recipient_profile_id = auth.uid());
create policy notifications_update_own on notifications for update
  using (recipient_profile_id = auth.uid());

-- =========================================================================
-- Lock down default grants: app role gets no UPDATE on append-only tables
-- once they exist (applied again in the migrations that create them).
-- =========================================================================
-- (kept here as a reminder comment; actual REVOKEs live in 0002b once
-- keyword_rankings / ai_checks / report_snapshots exist)
