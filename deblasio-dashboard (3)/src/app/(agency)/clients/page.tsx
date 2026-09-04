import Link from "next/link";
import { requireAgencyRole } from "@/lib/auth/session";
import { listClients } from "@/lib/data/clients";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  archived: "bg-gray-100 text-gray-500",
};

export default async function ClientsPage() {
  const session = await requireAgencyRole([
    "agency_admin",
    "account_manager",
    "seo_ai_team",
    "web_team",
  ]);
  const clients = await listClients(session.agency!.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        {(session.agency!.role === "agency_admin" ||
          session.agency!.role === "account_manager") && (
          <Link
            href="/clients/new"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + New Client
          </Link>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm font-medium text-gray-900">No clients yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add your first client to start tracking services and deliverables.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {c.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.company_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.start_date ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
