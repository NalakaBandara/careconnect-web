import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Not allowed", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-20 text-center">
      <h1 className="text-3xl">You do not have access</h1>
      <p className="mt-3 text-muted-foreground">
        Your account is signed in, but it does not have permission to view that page.
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
