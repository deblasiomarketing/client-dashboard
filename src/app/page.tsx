import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getAppSession();

  if (!session) redirect("/login");
  if (session.userType === "agency") redirect("/dashboard");
  redirect("/overview");
}
