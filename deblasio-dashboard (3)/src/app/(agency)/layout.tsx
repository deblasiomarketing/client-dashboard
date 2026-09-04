import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { navForRole } from "@/lib/nav/config";
import { SidebarNav } from "@/components/nav/sidebar-nav";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) redirect("/login");
  if (session.userType !== "agency" || !session.agency) redirect("/overview");

  const items = navForRole(session.agency.role);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNav items={items} title="DeBlasio" subtitle="Agency" />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
