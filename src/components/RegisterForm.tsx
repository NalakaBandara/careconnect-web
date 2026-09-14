"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { registerAction, type RegisterState } from "@/app/(auth)/register/actions";

const EMPTY: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, EMPTY);

  // Shown under an input, and linked to it for screen readers.
  const fieldError = (name: string) => state.fields?.[name]?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* Errors that belong to the whole form, not one field. */}
      {state.message && !state.fields && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <Field
        name="firstName"
        label="First name"
        autoComplete="given-name"
        defaultValue={state.values?.firstName}
        error={fieldError("firstName")}
      />
      <Field
        name="lastName"
        label="Last name"
        autoComplete="family-name"
        defaultValue={state.values?.lastName}
        error={fieldError("lastName")}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={fieldError("email")}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={fieldError("password")}
      />

      <Button type="submit" size="lg" disabled={isPending} className="mt-2">
        {isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
};

function Field({ name, label, hint, error, ...inputProps }: FieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={error ? "border-destructive" : ""}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
