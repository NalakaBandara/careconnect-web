import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

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
      <LoginForm justRegistered={params.registered === "1"} />
    </div>
  );
}
