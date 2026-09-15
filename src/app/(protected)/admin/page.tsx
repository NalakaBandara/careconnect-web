import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = (await getSession())!;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <h1 className="text-4xl">Admin area</h1>
      <p className="mt-2 text-muted-foreground">
        Only accounts holding the <strong>admin</strong> role can see this page.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Your roles: {user.roles.join(", ")}
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-block font-medium text-primary hover:underline"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
