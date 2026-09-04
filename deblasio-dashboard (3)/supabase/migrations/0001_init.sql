-- 0001_init.sql
-- Foundation schema: agencies, profiles, roles, clients, services, and the
-- core "what/who/when" objects (deliverables, tasks, activity, comments).
-- Later migrations (0002+) add SEO, AI Search, Website Work, Analytics,
-- Reporting per the phased build plan.

create extension if not exists "pgcrypto";

-- =========================================================================
-- ENUM-ish lookup types (kept as text + check constraint where future
-- configurability is likely, per spec's guidance to prefer lookup tables
-- over hard enums when values may grow).
-- =========================================================================

create type agency_role as enum (
  'agency_admin',
  'account_manager',
  'seo_ai_team',
  'web_team'
);

create type client_status as enum ('active', 'paused', 'archived');

create type deliverable_status as enum (
  'not_started', 'scheduled', 'in_progress', 'waiting_on_client',
  'internal_review', 'client_review', 'completed', 'cancelled'
);

create type task_status as enum (
  'not_started', 'in_progress', 'waiting', 'completed', 'cancelled'
);

create type comment_visibility as enum ('internal', 'client');

-- =========================================================================
-- CORE TENANCY
-- =========================================================================

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1:1 with auth.users. user_type discriminates agency staff vs client users;
-- a single human is one or the other, never both, in V1.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  user_type text not null check (user_type in ('agency', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agency_users (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role agency_role not null,
  created_at timestamptz not null default now(),
  unique (agency_id, profile_id)
);
create index idx_agency_users_profile on agency_users(profile_id);

create table clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  client_name text not null,
  company_name text,
  website_url text,
  primary_contact text,
  contact_email text,
  contact_phone text,
  account_manager_id uuid references agency_users(id) on delete set null,
  status client_status not null default 'active',
  start_date date,
  notes text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index idx_clients_agency on clients(agency_id);
create index idx_clients_status on clients(agency_id, status);

create table client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, profile_id)
);
create index idx_client_users_profile on client_users(profile_id);

-- Which agency staff are assigned to which clients (drives "assigned
-- clients" access for non-admin roles).
create table client_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_user_id uuid not null references agency_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, agency_user_id)
);
create index idx_client_assignments_agency_user on client_assignments(agency_user_id);
create index idx_client_assignments_client on client_assignments(client_id);

-- =========================================================================
-- SERVICES
-- =========================================================================

create table services (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (agency_id, name)
);

create table client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  status text not null default 'active' check (status in ('active','paused','ended')),
  monthly_scope jsonb not null default '{}'::jsonb, -- e.g. {"seo_categories":2,"ai_categories":2}
  started_at date,
  created_at timestamptz not null default now(),
  unique (client_id, service_id)
);
create index idx_client_services_client on client_services(client_id);

-- =========================================================================
-- CAMPAIGNS / DELIVERABLES / TASKS
-- =========================================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  service_id uuid references services(id),
  name text not null,
  status text not null default 'active' check (status in ('active','paused','completed')),
  target_geography text,
  start_date date,
  description text,
  assigned_team uuid[] default '{}', -- array of agency_user ids
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_campaigns_client on campaigns(client_id);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  service_id uuid references services(id),
  campaign_id uuid references campaigns(id) on delete set null,
  title text not null,
  description text,
  month date, -- first-of-month marker for "which reporting month"
  due_date date,
  assigned_user_id uuid references agency_users(id) on delete set null,
  status deliverable_status not null default 'not_started',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  client_visible boolean not null default true,
  requires_approval boolean not null default false,
  completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index idx_deliverables_client on deliverables(client_id);
create index idx_deliverables_status on deliverables(agency_id, status);
create index idx_deliverables_due on deliverables(agency_id, due_date);
create index idx_deliverables_assigned on deliverables(assigned_user_id);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  deliverable_id uuid references deliverables(id) on delete cascade,
  website_request_id uuid, -- FK added in 0004 after website_requests exists
  ai_question_id uuid,     -- FK added in 0003 after ai_questions exists
  keyword_category_id uuid, -- FK added in 0002
  title text not null,
  description text,
  assigned_user_id uuid references agency_users(id) on delete set null,
  due_date date,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status task_status not null default 'not_started',
  estimated_minutes integer,
  actual_minutes integer,
  internal_notes text,
  client_visible_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index idx_tasks_assigned on tasks(assigned_user_id);
create index idx_tasks_client on tasks(client_id);
create index idx_tasks_status on tasks(agency_id, status);

-- =========================================================================
-- COMMENTS / ACTIVITY / APPROVALS (generic, polymorphic via object_type/id)
-- =========================================================================

create table comments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  object_type text not null, -- 'deliverable' | 'website_request' | 'task' ...
  object_id uuid not null,
  author_id uuid not null references profiles(id),
  body text not null,
  visibility comment_visibility not null default 'internal',
  created_at timestamptz not null default now()
);
create index idx_comments_object on comments(object_type, object_id);
create index idx_comments_client on comments(client_id);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  object_type text not null,
  object_id uuid not null,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','changes_requested')),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  revision_notes text,
  created_at timestamptz not null default now()
);
create index idx_approvals_object on approvals(object_type, object_id);
create index idx_approvals_client on approvals(client_id, status);

create table activity_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid references profiles(id),
  event_type text not null,
  title text not null,
  description text,
  related_object_type text,
  related_object_id uuid,
  client_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_activity_client_time on activity_events(client_id, created_at desc);
create index idx_activity_agency_time on activity_events(agency_id, created_at desc);

create table files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  object_type text,
  object_id uuid,
  storage_path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles(id),
  client_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_files_object on files(object_type, object_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references profiles(id) on delete cascade,
  agency_id uuid,
  client_id uuid,
  event_type text not null,
  title text not null,
  body text,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_profile_id, read_at);

-- =========================================================================
-- updated_at trigger helper
-- =========================================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();
create trigger trg_campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();
create trigger trg_deliverables_updated_at before update on deliverables
  for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on tasks
  for each row execute function set_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
