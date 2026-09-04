import { redirect } from "next/navigation";
import { requireAgencyRole } from "@/lib/auth/session";
import { getClient } from "@/lib/data/clients";
import { NewClientForm } from "../../new/new-client-form";
import { updateClientAction } from "../../actions";

export default async function EditClientPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireAgencyRole(["agency_admin", "account_manager"]);
  } catch {
    redirect(`/clients/${params.id}`);
  }

  const client = await getClient(params.id);
  const boundAction = updateClientAction.bind(null, client.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Edit {client.client_name}
        </h1>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <NewClientForm
          action={boundAction}
          client={client}
          submitLabel="Save Changes"
          savingLabel="Saving..."
        />
      </div>
    </div>
  );
}
