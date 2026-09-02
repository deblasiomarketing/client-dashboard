import { createClient } from "@/lib/supabase/server";
import { requireAgencyRole } from "@/lib/auth/session";
import type { Client, ClientStatus } from "@/types/database";

/**
 * All client CRUD lives here rather than inline in page components, per
 * spec §64 ("separate data access from presentation"). RLS is still the
 * enforcement layer — these functions add the role check that applies
 * *before* hitting the DB, so a web_team user gets a clear "not allowed"
 * instead of a confusing empty result.
 */

export async function listClients(agencyId: string) {
  const supabase = createClient();
  // RLS already restricts this to clients in the caller's agency that
  // they're assigned to (or all, if admin) — no need to filter here too.
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, client_name, company_name, status, start_date, account_manager_id, website_url"
    )
    .order("client_name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getClient(clientId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) throw error;
  return data as Client;
}

export async function getClientServices(clientId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_services")
    .select("id, status, monthly_scope, started_at, services(id, name)")
    .eq("client_id", clientId);

  if (error) throw error;
  return data;
}

export async function getAvailableServices(agencyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
}

export async function getClientAssignments(clientId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_assignments")
    .select("agency_user_id")
    .eq("client_id", clientId);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.agency_user_id));
}

export async function listAgencyStaff(agencyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agency_users")
    .select("id, role, profiles(full_name)")
    .eq("agency_id", agencyId)
    .order("role");

  if (error) throw error;
  return data;
}

// --- Mutations (also used by Server Actions in actions.ts) --------------

export interface CreateClientInput {
  client_name: string;
  company_name?: string;
  website_url?: string;
  primary_contact?: string;
  contact_email?: string;
  contact_phone?: string;
  account_manager_id?: string | null;
  start_date?: string;
  notes?: string;
}

export async function createClientRecord(input: CreateClientInput) {
  const session = await requireAgencyRole(["agency_admin", "account_manager"]);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      agency_id: session.agency!.id,
      created_by: session.profile.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("activity_events").insert({
    client_id: data.id,
    agency_id: session.agency!.id,
    user_id: session.profile.id,
    event_type: "client_created",
    title: `${data.client_name} added as a new client`,
    client_visible: false,
  });

  return data as Client;
}

export async function updateClientStatus(clientId: string, status: ClientStatus) {
  await requireAgencyRole(["agency_admin", "account_manager"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId);

  if (error) throw error;
}

export async function addClientService(
  clientId: string,
  agencyId: string,
  serviceId: string,
  monthlyUnits: number
) {
  await requireAgencyRole(["agency_admin", "account_manager"]);
  const supabase = createClient();

  const { error } = await supabase.from("client_services").insert({
    client_id: clientId,
    agency_id: agencyId,
    service_id: serviceId,
    monthly_scope: { units: monthlyUnits },
    started_at: new Date().toISOString().slice(0, 10),
  });

  if (error) throw error;
}

export async function setClientAssignments(
  clientId: string,
  agencyUserIds: string[]
) {
  const session = await requireAgencyRole(["agency_admin", "account_manager"]);
  const supabase = createClient();

  // Simple replace-all approach: delete existing, insert the new set.
  const { error: delErr } = await supabase
    .from("client_assignments")
    .delete()
    .eq("client_id", clientId);
  if (delErr) throw delErr;

  if (agencyUserIds.length > 0) {
    const { error: insErr } = await supabase.from("client_assignments").insert(
      agencyUserIds.map((agency_user_id) => ({
        client_id: clientId,
        agency_user_id,
      }))
    );
    if (insErr) throw insErr;
  }
}
