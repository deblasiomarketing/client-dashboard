/**
 * Seed script — Phase 1 subset.
 *
 * Creates:
 *  - 1 agency (DeBlasio New Media Marketing)
 *  - 4 agency users, one per role
 *  - 1 demo client (Cape Shore Glass, per spec §70)
 *  - Core services + client_services scope
 *  - A handful of deliverables in mixed statuses (so dashboards render
 *    something other than an empty state)
 *
 * Run with: npm run seed
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS intentionally — this is
 * the one legitimate service-role use case: provisioning fixture data).
 *
 * NOTE: this creates auth.users via the admin API, so it must run against a
 * real (local or dev) Supabase project — it is not a pure SQL seed.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment."
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function createAuthUser(email: string, fullName: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "DevPassword123!",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!;
}

async function main() {
  console.log("Seeding DeBlasio Marketing Dashboard demo data...");

  // --- Agency -------------------------------------------------------
  const { data: agency, error: agencyErr } = await admin
    .from("agencies")
    .insert({ name: "DeBlasio New Media Marketing", slug: "deblasio" })
    .select()
    .single();
  if (agencyErr) throw agencyErr;

  // --- Agency staff, one per role -------------------------------------
  const staffSpecs = [
    { email: "admin@deblasio.demo", name: "Ava Deblasio", role: "agency_admin" },
    { email: "am@deblasio.demo", name: "Marcus Reyes", role: "account_manager" },
    { email: "seo@deblasio.demo", name: "Priya Nandan", role: "seo_ai_team" },
    { email: "web@deblasio.demo", name: "Jordan Cole", role: "web_team" },
  ] as const;

  const agencyUserIds: Record<string, string> = {};

  for (const s of staffSpecs) {
    const user = await createAuthUser(s.email, s.name);
    await admin.from("profiles").insert({
      id: user.id,
      full_name: s.name,
      user_type: "agency",
    });
    const { data: au } = await admin
      .from("agency_users")
      .insert({ agency_id: agency.id, profile_id: user.id, role: s.role })
      .select()
      .single();
    agencyUserIds[s.role] = au.id;
  }

  // --- Services -------------------------------------------------------
  const serviceNames = [
    "SEO",
    "AI Search Optimization",
    "Website Maintenance",
    "Google Ads",
    "Display / Retargeting",
    "META Advertising",
    "Email Marketing",
    "Social Media",
    "Analytics / Reporting",
  ];
  const { data: services } = await admin
    .from("services")
    .insert(serviceNames.map((name) => ({ agency_id: agency.id, name })))
    .select();

  const svc = (name: string) => services!.find((s) => s.name === name)!.id;

  // --- Demo client: Cape Shore Glass (spec §70) ------------------------
  const { data: client } = await admin
    .from("clients")
    .insert({
      agency_id: agency.id,
      client_name: "Cape Shore Glass",
      company_name: "Cape Shore Glass & Mirror Co.",
      website_url: "https://capeshoreglass.example.com",
      primary_contact: "Dana Ferreira",
      contact_email: "dana@capeshoreglass.example.com",
      account_manager_id: agencyUserIds["account_manager"],
      status: "active",
      start_date: "2026-01-15",
    })
    .select()
    .single();

  await admin.from("client_assignments").insert(
    Object.values(agencyUserIds).map((id) => ({
      client_id: client.id,
      agency_user_id: id,
    }))
  );

  await admin.from("client_services").insert([
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("SEO"),
      monthly_scope: { seo_categories: 2 },
      started_at: "2026-01-15",
    },
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("AI Search Optimization"),
      monthly_scope: { ai_categories: 2 },
      started_at: "2026-01-15",
    },
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("Website Maintenance"),
      monthly_scope: { included_hours: 3 },
      started_at: "2026-01-15",
    },
  ]);

  // --- A client contact login -------------------------------------
  const clientContact = await createAuthUser(
    "dana@capeshoreglass.demo",
    "Dana Ferreira"
  );
  await admin.from("profiles").insert({
    id: clientContact.id,
    full_name: "Dana Ferreira",
    user_type: "client",
  });
  await admin
    .from("client_users")
    .insert({ client_id: client.id, profile_id: clientContact.id });

  // --- Deliverables, mixed statuses (so dashboards aren't empty) ------
  const month = "2026-08-01";
  await admin.from("deliverables").insert([
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("SEO"),
      title: "Custom Shower Doors — on-page optimization",
      month,
      due_date: "2026-08-14",
      status: "completed",
      completed_date: "2026-08-14",
      client_visible: true,
    },
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("AI Search Optimization"),
      title: "Glass Railings — AI Search question set",
      month,
      due_date: "2026-08-20",
      status: "in_progress",
      client_visible: true,
    },
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("Website Maintenance"),
      title: "Homepage hero image refresh",
      month,
      due_date: "2026-08-10",
      status: "not_started",
      client_visible: true,
    },
    {
      client_id: client.id,
      agency_id: agency.id,
      service_id: svc("SEO"),
      title: "Gym Mirrors — internal linking pass",
      month,
      due_date: "2026-08-05", // overdue on purpose, to populate Attention Required
      status: "in_progress",
      client_visible: false,
    },
  ]);

  // --- A couple of client-visible activity events ---------------------
  await admin.from("activity_events").insert([
    {
      client_id: client.id,
      agency_id: agency.id,
      event_type: "seo_work_completed",
      title: "AI Search optimization completed for Custom Glass Railings",
      client_visible: true,
    },
    {
      client_id: client.id,
      agency_id: agency.id,
      event_type: "content_published",
      title: "New FAQ content published",
      client_visible: true,
    },
  ]);

  console.log("Seed complete.");
  console.log("Demo logins (password: DevPassword123!):");
  staffSpecs.forEach((s) => console.log(`  ${s.role}: ${s.email}`));
  console.log("  client: dana@capeshoreglass.demo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
