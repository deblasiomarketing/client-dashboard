import { createClient } from "@/lib/supabase/server";
import type { AppSession } from "@/types/database";

/**
 * Resolves the current request's session into an AppSession, deriving
 * role and client access ENTIRELY from the database — never from a
 * client-supplied cookie claim, header, or request body field. This is
 * the single function every server action / route handler should call
 * before making an authorization decision.
 *
 * Returns null if there is no authenticated user.
 */
export async function getAppSession(): Promise<AppSession | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  if (profile.user_type === "agency") {
    const { data: agencyUser } = await supabase
      .from("agency_users")
      .select("agency_id, role")
      .eq("profile_id", user.id)
      .single();

    if (!agencyUser) return null; // profile exists but no agency membership yet

    return {
      profile,
      userType: "agency",
      agency: { id: agencyUser.agency_id, role: agencyUser.role },
    };
  }

  // client user
  const { data: clientLinks } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("profile_id", user.id);

  return {
    profile,
    userType: "client",
    clientIds: (clientLinks ?? []).map((c) => c.client_id),
  };
}

/** Throws if there is no session. Use in Server Actions / route handlers. */
export async function requireSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/** Throws unless the session is agency staff with one of the allowed roles. */
export async function requireAgencyRole(
  allowed: Array<"agency_admin" | "account_manager" | "seo_ai_team" | "web_team">
) {
  const session = await requireSession();
  if (session.userType !== "agency" || !session.agency) {
    throw new Error("FORBIDDEN");
  }
  if (!allowed.includes(session.agency.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** Throws unless the session is a client user authorized for clientId. */
export async function requireClientAccess(clientId: string) {
  const session = await requireSession();
  if (session.userType !== "client" || !session.clientIds?.includes(clientId)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
