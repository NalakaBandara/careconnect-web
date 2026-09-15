import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Second line of defence. proxy.ts already redirected guests, but this check
// runs on the server at render time and cannot be bypassed by a bad matcher.
export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  if (!user) redirect("/login");
  return <>{children}</>;
}
