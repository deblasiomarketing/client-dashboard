"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClientRecord,
  updateClientStatus,
  addClientService,
  setClientAssignments,
} from "@/lib/data/clients";
import { requireAgencyRole } from "@/lib/auth/session";

const createClientSchema = z.object({
  client_name: z.string().min(1, "Client name is required").max(200),
  company_name: z.string().max(200).optional().or(z.literal("")),
  website_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  primary_contact: z.string().max(200).optional().or(z.literal("")),
  contact_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contact_phone: z.string().max(50).optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createClientAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createClientSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  let newId: string;
  try {
    const clean = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== "")
    );
    const client = await createClientRecord(clean as any);
    newId = client.id;
  } catch (err: any) {
    return { error: err.message ?? "Something went wrong creating the client." };
  }

  revalidatePath("/clients");
  redirect(`/clients/${newId}`);
}

export async function archiveClientAction(clientId: string) {
  await requireAgencyRole(["agency_admin", "account_manager"]);
  await updateClientStatus(clientId, "archived");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function pauseClientAction(clientId: string) {
  await requireAgencyRole(["agency_admin", "account_manager"]);
  await updateClientStatus(clientId, "paused");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function reactivateClientAction(clientId: string) {
  await requireAgencyRole(["agency_admin", "account_manager"]);
  await updateClientStatus(clientId, "active");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

const addServiceSchema = z.object({
  clientId: z.string().uuid(),
  agencyId: z.string().uuid(),
  serviceId: z.string().uuid(),
  monthlyUnits: z.coerce.number().int().min(0).max(1000),
});

export async function addClientServiceAction(formData: FormData) {
  const parsed = addServiceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  await addClientService(
    parsed.data.clientId,
    parsed.data.agencyId,
    parsed.data.serviceId,
    parsed.data.monthlyUnits
  );
  revalidatePath(`/clients/${parsed.data.clientId}`);
}

export async function updateAssignmentsAction(clientId: string, formData: FormData) {
  const ids = formData.getAll("agencyUserIds").map(String);
  await setClientAssignments(clientId, ids);
  revalidatePath(`/clients/${clientId}`);
}
