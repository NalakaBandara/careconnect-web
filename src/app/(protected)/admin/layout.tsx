import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getSession, isAdmin } from "@/lib/session";

// Admin-only. A logged-in non-admin gets /forbidden, NOT /login - they are
// already authenticated, so sending them to log in again would be a dead end.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/forbidden");

  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <aside className="border-b border-border pb-4 lg:border-b-0 lg:pb-0">
          <AdminNav />
          <Link
            href="/dashboard"
            className="mt-4 block px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Back to dashboard
          </Link>
        </aside>

        {/* A landmark, so assistive technology can skip the sidebar. */}
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
