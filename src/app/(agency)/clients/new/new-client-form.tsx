"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClientAction, type FormState } from "../actions";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Creating..." : "Create Client"}
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function NewClientForm() {
  const [state, formAction] = useFormState(createClientAction, initialState);

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
          error={state.fieldErrors?.client_name}
        />
        <Field
          name="company_name"
          label="Company Name"
          error={state.fieldErrors?.company_name}
        />
        <Field
          name="website_url"
          label="Website URL"
          type="url"
          error={state.fieldErrors?.website_url}
        />
        <Field
          name="start_date"
          label="Start Date"
          type="date"
          error={state.fieldErrors?.start_date}
        />
        <Field
          name="primary_contact"
          label="Primary Contact"
          error={state.fieldErrors?.primary_contact}
        />
        <Field
          name="contact_email"
          label="Contact Email"
          type="email"
          error={state.fieldErrors?.contact_email}
        />
        <Field
          name="contact_phone"
          label="Contact Phone"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
