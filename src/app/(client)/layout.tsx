import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { clientNav } from "@/lib/nav/config";
import { SidebarNav } from "@/components/nav/sidebar-nav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) redirect("/login");
  if (session.userType !== "client") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-white">
      <SidebarNav items={clientNav} title="Your Marketing" subtitle="Client Portal" />
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
