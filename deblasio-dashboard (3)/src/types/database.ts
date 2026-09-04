// Core domain types mirroring supabase/migrations/0001_init.sql.
// Hand-written for Phase 1; once the schema stabilizes, generate these with
// `supabase gen types typescript` and treat this file as the fallback for
// tables the generator hasn't caught up to yet.

export type AgencyRole =
  | "agency_admin"
  | "account_manager"
  | "seo_ai_team"
  | "web_team";

export type UserType = "agency" | "client";

export type ClientStatus = "active" | "paused" | "archived";

export type DeliverableStatus =
  | "not_started"
  | "scheduled"
  | "in_progress"
  | "waiting_on_client"
  | "internal_review"
  | "client_review"
  | "completed"
  | "cancelled";

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export type Priority = "low" | "normal" | "high" | "urgent";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export interface AgencyUser {
  id: string;
  agency_id: string;
  profile_id: string;
  role: AgencyRole;
  created_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  client_name: string;
  company_name: string | null;
  website_url: string | null;
  primary_contact: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  account_manager_id: string | null;
  status: ClientStatus;
  start_date: string | null;
  notes: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ClientService {
  id: string;
  client_id: string;
  agency_id: string;
  service_id: string;
  status: "active" | "paused" | "ended";
  monthly_scope: Record<string, number>;
  started_at: string | null;
}

export interface Campaign {
  id: string;
  client_id: string;
  agency_id: string;
  service_id: string | null;
  name: string;
  status: "active" | "paused" | "completed";
  target_geography: string | null;
  start_date: string | null;
  description: string | null;
  assigned_team: string[];
}

export interface Deliverable {
  id: string;
  client_id: string;
  agency_id: string;
  service_id: string | null;
  campaign_id: string | null;
  title: string;
  description: string | null;
  month: string | null;
  due_date: string | null;
  assigned_user_id: string | null;
  status: DeliverableStatus;
  priority: Priority;
  client_visible: boolean;
  requires_approval: boolean;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string | null;
  agency_id: string;
  deliverable_id: string | null;
  website_request_id: string | null;
  ai_question_id: string | null;
  keyword_category_id: string | null;
  title: string;
  description: string | null;
  assigned_user_id: string | null;
  due_date: string | null;
  priority: Priority;
  status: TaskStatus;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  internal_notes: string | null;
  client_visible_notes: string | null;
}

export interface ActivityEvent {
  id: string;
  client_id: string;
  agency_id: string;
  user_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  related_object_type: string | null;
  related_object_id: string | null;
  client_visible: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  client_id: string;
  agency_id: string;
  object_type: string;
  object_id: string;
  author_id: string;
  body: string;
  visibility: "internal" | "client";
  created_at: string;
}

export interface Approval {
  id: string;
  client_id: string;
  agency_id: string;
  object_type: string;
  object_id: string;
  requested_at: string;
  status: "pending" | "approved" | "changes_requested";
  approved_at: string | null;
  approved_by: string | null;
  revision_notes: string | null;
}

// Session-derived context, computed once per request in src/lib/auth.
export interface AppSession {
  profile: Profile;
  userType: UserType;
  // populated when userType === "agency"
  agency?: { id: string; role: AgencyRole };
  // populated when userType === "client"
  clientIds?: string[];
}
