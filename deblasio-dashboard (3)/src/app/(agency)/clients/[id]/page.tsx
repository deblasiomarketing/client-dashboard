import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyRole } from "@/lib/auth/session";
import {
  getClient,
  getClientServices,
  getAvailableServices,
  getClientAssignments,
  listAgencyStaff,
  listClientUsers,
} from "@/lib/data/clients";
import {
  archiveClientAction,
  pauseClientAction,
  reactivateClientAction,
  addClientServiceAction,
  updateAssignmentsAction,
} from "../actions";
import { InviteClientUserForm } from "./portal-users/invite-form";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  archived: "bg-gray-100 text-gray-500",
};

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAgencyRole([
    "agency_admin",
    "account_manager",
    "seo_ai_team",
    "web_team",
  ]);

  let client;
  try {
    client = await getClient(params.id);
  } catch {
    notFound();
  }

  const [services, availableServices, assignedStaffIds, staff, portalUsers] =
    await Promise.all([
      getClientServices(client.id),
      getAvailableServices(session.agency!.id),
      getClientAssignments(client.id),
      listAgencyStaff(session.agency!.id),
      listClientUsers(client.id),
    ]);

  const canManage =
    session.agency!.role === "agency_admin" ||
    session.agency!.role === "account_manager";
  const isAdmin = session.agency!.role === "agency_admin";

  const boundArchive = archiveClientAction.bind(null, client.id);
  const boundPause = pauseClientAction.bind(null, client.id);
  const boundReactivate = reactivateClientAction.bind(null, client.id);
  const boundAssignments = updateAssignmentsAction.bind(null, client.id);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {client.client_name}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[client.status]}`}
            >
              {client.status}
            </span>
          </div>
          {client.company_name && (
            <p className="text-sm text-gray-500">{client.company_name}</p>
          )}
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Link
              href={`/clients/${client.id}/edit`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Link>
            {client.status !== "active" && (
              <form action={boundReactivate}>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Reactivate
                </button>
              </form>
            )}
            {client.status === "active" && (
              <form action={boundPause}>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Pause
                </button>
              </form>
            )}
            {client.status !== "archived" && (
              <form action={boundArchive}>
                <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                  Archive
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Client info */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Client Information
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
          <InfoRow label="Website" value={client.website_url} isLink />
          <InfoRow label="Primary Contact" value={client.primary_contact} />
          <InfoRow label="Contact Email" value={client.contact_email} />
          <InfoRow label="Contact Phone" value={client.contact_phone} />
          <InfoRow label="Start Date" value={client.start_date} />
        </dl>
        {client.notes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {client.notes}
            </p>
          </div>
        )}
      </section>

      {/* Services */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Services</h2>
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">No services added yet.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {services.map((s: any) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900">
                  {s.services?.name}
                </span>
                <span className="text-gray-500">
                  {s.monthly_scope?.units ?? 0} units/month · {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canManage && availableServices.length > 0 && (
          <form
            action={addClientServiceAction}
            className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
          >
            <input type="hidden" name="clientId" value={client.id} />
            <input type="hidden" name="agencyId" value={session.agency!.id} />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Add Service
              </label>
              <select
                name="serviceId"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Monthly Units
              </label>
              <input
                type="number"
                name="monthlyUnits"
                min={0}
                defaultValue={2}
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
              Add
            </button>
          </form>
        )}
      </section>

      {/* Client portal users — who can log in as this client */}
      {canManage && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Client Portal Access
          </h2>
          {portalUsers.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">
              No portal logins yet — {client.client_name} can't sign in
              until you create one below.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {portalUsers.map((u: any) => (
                <li
                  key={u.id}
                  className="rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-900"
                >
                  {u.profiles?.full_name}
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-100 pt-4">
            <InviteClientUserForm clientId={client.id} />
          </div>
        </section>
      )}

      {/* Assigned staff — admin only, per role permissions in spec §3 */}
      {isAdmin && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Assigned Team
          </h2>
          <form action={boundAssignments} className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {staff.map((s: any) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="agencyUserIds"
                    value={s.id}
                    defaultChecked={assignedStaffIds.has(s.id)}
                  />
                  <span className="text-gray-900">{s.profiles?.full_name}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {s.role.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
            </div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
              Save Assignments
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900">
        {!value ? (
          "—"
        ) : isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
