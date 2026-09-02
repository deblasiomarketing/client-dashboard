import { createClient } from "@/lib/supabase/server";
import { requireAgencyRole } from "@/lib/auth/session";
import { MetricCard } from "@/components/ui/metric-card";

// Spec §5 (Agency Dashboard) + §6 (Attention Required) + §56 (visual priority:
// 1. attention required, 2. work progress, 3. performance, 4. recent activity)
export default async function AgencyDashboardPage() {
  const session = await requireAgencyRole([
    "agency_admin",
    "account_manager",
    "seo_ai_team",
    "web_team",
  ]);
  const supabase = createClient();
  const agencyId = session.agency!.id;

  const [{ count: activeClients }, { data: overdue }, { data: dueThisWeek }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .eq("status", "active"),
      supabase
        .from("deliverables")
        .select("id, title, due_date, client_id")
        .eq("agency_id", agencyId)
        .lt("due_date", new Date().toISOString().slice(0, 10))
        .neq("status", "completed")
        .neq("status", "cancelled")
        .limit(10),
      supabase
        .from("deliverables")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .gte("due_date", new Date().toISOString().slice(0, 10)),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Agency Dashboard</h1>
        <p className="text-sm text-gray-500">
          Operations overview across every client.
        </p>
      </div>

      {/* 1. Attention Required — highest visual priority */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-semibold text-amber-900">Attention Required</h2>
        {overdue && overdue.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {overdue.map((d) => (
              <li key={d.id} className="text-sm text-amber-900">
                Overdue: <span className="font-medium">{d.title}</span> — was due{" "}
                {d.due_date}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-amber-800">
            Nothing needs attention right now.
          </p>
        )}
      </section>

      {/* 2. Work progress */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">This Month</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Active Clients" value={activeClients ?? 0} />
          <MetricCard label="Due This Week" value={dueThisWeek?.length ?? 0} />
          <MetricCard label="Overdue Tasks" value={overdue?.length ?? 0} tone={overdue && overdue.length > 0 ? "bad" : "good"} />
          <MetricCard label="Client Approvals Waiting" value="—" />
        </div>
      </section>

      {/* 3 & 4: Performance + Recent Activity are added in Phase 4/5/9 once
          SEO, AI Search, and reporting data exist. Placeholder for now. */}
      <section className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        SEO / AI Search performance rollups and the agency-wide activity feed
        land in Phase 4–5 once those modules exist.
      </section>
    </div>
  );
}
