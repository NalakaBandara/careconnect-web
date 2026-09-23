import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { safeNext } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your CareConnect account.",
  robots: { index: false },
};

// searchParams is a Promise in current Next, so it must be awaited.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <h1 className="text-3xl">Log in to CareConnect</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Appointments, reminders and your personal details stay inside your account.
      </p>
      {/* Validated here, on the server, and passed to the action already
          checked. proxy.ts put the path they were heading for in ?next=,
          and it arrives from the URL bar, so it cannot be trusted as given. */}
      <LoginForm justRegistered={params.registered === "1"} next={safeNext(params.next)} />
    </div>
  );
}
