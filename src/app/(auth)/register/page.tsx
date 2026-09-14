import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Register for a CareConnect account to book appointments.",
  // Sign-up pages should not appear in search results.
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <h1 className="text-3xl">Create your account</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Registering takes a minute and lets you book appointments with any listed
        professional.
      </p>
      <RegisterForm />
    </div>
  );
}
