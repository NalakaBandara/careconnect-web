"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";

const EMPTY: LoginState = {};

export default function LoginForm({ justRegistered }: { justRegistered: boolean }) {
  const [state, formAction, isPending] = useActionState(loginAction, EMPTY);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {justRegistered && !state.message && (
        <p
          role="status"
          className="rounded-md border border-primary bg-primary-soft px-3 py-2 text-sm text-accent-foreground"
        >
          Account created. Please log in.
        </p>
      )}

      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={state.fields?.email ? true : undefined}
          aria-describedby={state.fields?.email ? "email-error" : undefined}
          className={state.fields?.email ? "border-destructive" : ""}
        />
        {state.fields?.email?.[0] && (
          <p id="email-error" className="text-xs text-destructive">
            {state.fields.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={state.fields?.password ? true : undefined}
          aria-describedby={state.fields?.password ? "password-error" : undefined}
          className={state.fields?.password ? "border-destructive" : ""}
        />
        {state.fields?.password?.[0] && (
          <p id="password-error" className="text-xs text-destructive">
            {state.fields.password[0]}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="mt-2">
        {isPending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-sm text-muted-foreground">
        New to CareConnect?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
