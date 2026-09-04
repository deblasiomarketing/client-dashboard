"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClientAction, type FormState } from "../actions";
import type { Client } from "@/types/database";

const initialState: FormState = {};

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function Field({
  name,
  label,
  type = "text",
  required = false,
  error,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function NewClientForm({
  action = createClientAction,
  submitLabel = "Create Client",
  savingLabel = "Creating...",
  client,
}: {
  action?: Action;
  submitLabel?: string;
  savingLabel?: string;
  client?: Client;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          name="client_name"
          label="Client Name"
          required
          defaultValue={client?.client_name}
          error={state.fieldErrors?.client_name}
        />
        <Field
          name="company_name"
          label="Company Name"
          defaultValue={client?.company_name}
          error={state.fieldErrors?.company_name}
        />
        <Field
          name="website_url"
          label="Website URL"
          type="url"
          defaultValue={client?.website_url}
          error={state.fieldErrors?.website_url}
        />
        <Field
          name="start_date"
          label="Start Date"
          type="date"
          defaultValue={client?.start_date}
          error={state.fieldErrors?.start_date}
        />
        <Field
          name="primary_contact"
          label="Primary Contact"
          defaultValue={client?.primary_contact}
          error={state.fieldErrors?.primary_contact}
        />
        <Field
          name="contact_email"
          label="Contact Email"
          type="email"
          defaultValue={client?.contact_email}
          error={state.fieldErrors?.contact_email}
        />
        <Field
          name="contact_phone"
          label="Contact Phone"
          defaultValue={client?.contact_phone}
          error={state.fieldErrors?.contact_phone}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Notes
        </label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={client?.notes ?? undefined}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <SubmitButtonLabeled submitLabel={submitLabel} savingLabel={savingLabel} />
    </form>
  );
}

function SubmitButtonLabeled({
  submitLabel,
  savingLabel,
}: {
  submitLabel: string;
  savingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? savingLabel : submitLabel}
    </button>
  );
}
