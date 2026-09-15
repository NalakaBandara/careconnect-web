import { redirect } from "next/navigation";
import { getSession, hasRole } from "@/lib/session";

// Admin-only. A logged-in non-admin gets /forbidden, NOT /login - they are
// already authenticated, so sending them to log in again would be a dead end.
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!hasRole(user, "admin")) redirect("/forbidden");
  return <>{children}</>;
}
