"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import type { ClinicFormState } from "@/app/(protected)/admin/clinics/actions";
import type { Clinic } from "@/types";

type Action = (prev: ClinicFormState, formData: FormData) => Promise<ClinicFormState>;

// One form for adding and for editing. The only differences are the action it
// posts to and the values it starts with, so two files would be two files to
// keep in step.
export default function ClinicForm({
  action,
  clinic,
  submitLabel,
}: {
  action: Action;
  clinic?: Clinic;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: string) => state.fields?.[name]?.[0];

  // After a failed submit show what was typed; otherwise fall back to the
  // existing record, or empty for a new one.
  const value = (name: string, existing?: string | null) =>
    state.values?.[name] ?? existing ?? "";

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-5">
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <Field
        name="name"
        label="Clinic name"
        defaultValue={value("name", clinic?.name)}
        error={errorFor("name")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="addressLine1"
          label="Street address"
          defaultValue={value("addressLine1", clinic?.addressLine1)}
          error={errorFor("addressLine1")}
        />
        <Field
          name="city"
          label="Town or city"
          hint="Used by the location filter"
          defaultValue={value("city", clinic?.city)}
          error={errorFor("city")}
        />
        <Field
          name="telephone"
          label="Telephone"
          hint="Optional"
          type="tel"
          defaultValue={value("telephone", clinic?.telephone)}
          error={errorFor("telephone")}
        />
        <Field
          name="email"
          label="Email"
          hint="Optional"
          type="email"
          defaultValue={value("email")}
          error={errorFor("email")}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="font-normal text-muted-foreground">Optional</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={value("description")}
          aria-invalid={errorFor("description") ? true : undefined}
          aria-describedby={errorFor("description") ? "description-error" : undefined}
          className={
            "w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
            (errorFor("description") ? "border-destructive" : "border-input")
          }
        />
        {errorFor("description") && (
          <p id="description-error" className="text-sm text-destructive">
            {errorFor("description")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Link href="/admin/clinics" className={buttonClasses("outline", "md")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  ...props
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
      </label>
      <Input
        id={name}
        name={name}
        // aria-invalid marks the field wrong; aria-describedby ties the message
        // to it, so a screen reader reads both together.
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={error ? "border-destructive" : ""}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
