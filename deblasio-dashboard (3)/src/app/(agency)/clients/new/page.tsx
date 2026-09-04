import { redirect } from "next/navigation";
import { requireAgencyRole } from "@/lib/auth/session";
import { NewClientForm } from "./new-client-form";

export default async function NewClientPage() {
  try {
    await requireAgencyRole(["agency_admin", "account_manager"]);
  } catch {
    redirect("/clients");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">New Client</h1>
        <p className="text-sm text-gray-500">
          Add a client to start tracking services and deliverables.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <NewClientForm />
      </div>
    </div>
  );
}
