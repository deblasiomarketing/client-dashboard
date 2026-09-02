import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time, browser-triggered version of scripts/seed.ts, for people
 * deploying without a local terminal. Visit:
 *   https://your-app.vercel.app/api/admin/seed?secret=YOUR_SEED_SECRET
 * exactly once after setting SEED_SECRET in Vercel's env vars.
 *
 * SECURITY: this route creates real auth users and writes real rows using
 * the service-role key. Set SEED_SECRET to something long and random, run
 * it once, then either delete this route or remove SEED_SECRET from your
 * env vars so the endpoint stops working. Do not leave this enabled on a
 * production deployment with real client data.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on the server." },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const log: string[] = [];

  try {
    // --- Agency -------------------------------------------------------
    const { data: agency, error: agencyErr } = await admin
      .from("agencies")
      .insert({ name: "DeBlasio New Media Marketing", slug: "deblasio" })
      .select()
      .single();
    if (agencyErr) throw agencyErr;
    log.push(`Created agency: ${agency.name}`);

    // --- Agency staff, one per role -------------------------------------
    const staffSpecs = [
      { email: "admin@deblasio.demo", name: "Ava Deblasio", role: "agency_admin" },
      { email: "am@deblasio.demo", name: "Marcus Reyes", role: "account_manager" },
      { email: "seo@deblasio.demo", name: "Priya Nandan", role: "seo_ai_team" },
      { email: "web@deblasio.demo", name: "Jordan Cole", role: "web_team" },
    ] as const;

    const agencyUserIds: Record<string, string> = {};

    for (const s of staffSpecs) {
      const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
        email: s.email,
        password: "DevPassword123!",
        email_confirm: true,
      });
      if (userErr) throw userErr;
      const user = userRes.user!;

      await admin.from("profiles").insert({
        id: user.id,
        full_name: s.name,
        user_type: "agency",
      });
      const { data: au, error: auErr } = await admin
        .from("agency_users")
        .insert({ agency_id: agency.id, profile_id: user.id, role: s.role })
        .select()
        .single();
      if (auErr) throw auErr;
      agencyUserIds[s.role] = au.id;
      log.push(`Created agency user: ${s.email} (${s.role})`);
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
    const { data: services, error: servicesErr } = await admin
      .from("services")
      .insert(serviceNames.map((name) => ({ agency_id: agency.id, name })))
      .select();
    if (servicesErr) throw servicesErr;
    const svc = (name: string) => services!.find((s) => s.name === name)!.id;
    log.push(`Created ${services!.length} services`);

    // --- Demo client: Cape Shore Glass -----------------------------
    const { data: client, error: clientErr } = await admin
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
    if (clientErr) throw clientErr;
    log.push(`Created client: ${client.client_name}`);

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
    log.push("Created client_services scope");

    // --- Client contact login -------------------------------------
    const { data: contactRes, error: contactErr } = await admin.auth.admin.createUser({
      email: "dana@capeshoreglass.demo",
      password: "DevPassword123!",
      email_confirm: true,
    });
    if (contactErr) throw contactErr;
    const clientContact = contactRes.user!;

    await admin.from("profiles").insert({
      id: clientContact.id,
      full_name: "Dana Ferreira",
      user_type: "client",
    });
    await admin
      .from("client_users")
      .insert({ client_id: client.id, profile_id: clientContact.id });
    log.push("Created client login: dana@capeshoreglass.demo");

    // --- Deliverables, mixed statuses -----------------------------------
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
        due_date: "2026-08-05",
        status: "in_progress",
        client_visible: false,
      },
    ]);
    log.push("Created 4 demo deliverables");

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
    log.push("Created client-visible activity events");

    return NextResponse.json({
      ok: true,
      log,
      logins: {
        password: "DevPassword123!",
        agency_admin: "admin@deblasio.demo",
        account_manager: "am@deblasio.demo",
        seo_ai_team: "seo@deblasio.demo",
        web_team: "web@deblasio.demo",
        client: "dana@capeshoreglass.demo",
      },
      reminder:
        "Seeding is done. Remove SEED_SECRET from your Vercel env vars now so this endpoint stops working.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? String(err), log },
      { status: 500 }
    );
  }
}
