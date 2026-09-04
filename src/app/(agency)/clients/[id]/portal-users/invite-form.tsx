"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteClientUserAction, type InviteState } from "../../actions";

const initialState: InviteState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Creating login..." : "Create Login"}
    </button>
  );
}

export function InviteClientUserForm({ clientId }: { clientId: string }) {
  const [state, formAction] = useFormState(inviteClientUserAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="font-medium text-emerald-900">Login created.</p>
        <p className="mt-1 text-emerald-800">
          Share these credentials with the client securely — this password
          won't be shown again:
        </p>
        <p className="mt-2 font-mono text-emerald-900">
          {state.success.email} / {state.success.tempPassword}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Full Name
        </label>
        <input
          name="fullName"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <SubmitButton />
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
