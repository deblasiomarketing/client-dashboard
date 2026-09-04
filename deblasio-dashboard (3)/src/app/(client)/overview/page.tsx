import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/ui/metric-card";

// Spec §9–12: answers "what are you doing / what have you completed /
// what results are we seeing / what happens next" — deliberately simpler
// than the agency shell (§71).
export default async function ClientOverviewPage() {
  const session = await requireSession();
  if (session.userType !== "client" || !session.clientIds?.length) {
    redirect("/login");
  }

  const supabase = createClient();
  const clientId = session.clientIds[0]; // TODO: client switcher once a
  // user is linked to more than one client account.

  const { data: services } = await supabase
    .from("client_services")
    .select("id, status, service_id, services(name)")
    .eq("client_id", clientId)
    .eq("status", "active");

  const { data: recentActivity } = await supabase
    .from("activity_events")
    .select("id, title, description, created_at")
    .eq("client_id", clientId)
    .eq("client_visible", true)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">
          Here's what your marketing team is doing and how it's performing.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Current Services
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {services && services.length > 0 ? (
            services.map((s: any) => (
              <div key={s.id} className="rounded-xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{s.services?.name}</p>
                <p className="mt-1 text-xs text-emerald-600">Active</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No active services yet — check back soon.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Performance Snapshot
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Organic Visitors" value="—" />
          <MetricCard label="Total Leads" value="—" />
          <MetricCard label="Keywords in Top 10" value="—" />
          <MetricCard label="AI Visibility Score" value="—" />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Populated once GA4 / Search Console sync (Phase 8) is connected.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Recent Activity
        </h2>
        {recentActivity && recentActivity.length > 0 ? (
          <ul className="space-y-3">
            {recentActivity.map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                {a.description && (
                  <p className="text-sm text-gray-500">{a.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Nothing published yet — completed work will show up here.
          </p>
        )}
      </section>
    </div>
  );
}
