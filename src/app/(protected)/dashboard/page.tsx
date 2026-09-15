import type { Metadata } from "next";
import Link from "next/link";
import { getSession, hasRole } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Safe to assert: the layout above already redirected anyone without a session.
  const user = (await getSession())!;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <h1 className="text-4xl">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Signed in as {user.email}</p>

      <dl className="mt-8 grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User ID
          </dt>
          <dd className="mt-1">{user.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Roles
          </dt>
          <dd className="mt-1">{user.roles.join(", ") || "none"}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {hasRole(user, "admin") && (
          <Link
            href="/admin"
            className="font-medium text-primary hover:underline"
          >
            Go to admin area
          </Link>
        )}
        <LogoutButton />
      </div>
    </main>
  );
}
