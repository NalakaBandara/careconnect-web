"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import type { BookingState } from "@/app/(protected)/book/[professionalId]/actions";

type Action = (prev: BookingState, formData: FormData) => Promise<BookingState>;

export default function BookingDetailsForm({
  action,
  backHref,
}: {
  action: Action;
  backHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  // Small helper so each field wires up its own error the same way.
  const errorFor = (name: keyof NonNullable<BookingState["fields"]>) =>
    state.fields?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && (
        // role="alert" makes a screen reader announce this the moment it
        // appears, without the user having to go looking for it.
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <Field
        name="fullName"
        label="Full name"
        defaultValue={state.values?.fullName}
        autoComplete="name"
        error={errorFor("fullName")}
      />

      <Field
        name="contactNumber"
        label="Contact number"
        type="tel"
        defaultValue={state.values?.contactNumber}
        autoComplete="tel"
        error={errorFor("contactNumber")}
      />

      <Field
        name="reason"
        label="Reason for visit"
        defaultValue={state.values?.reason}
        error={errorFor("reason")}
      />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Anything the clinic should know? <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={state.values?.notes}
          aria-invalid={errorFor("notes") ? true : undefined}
          aria-describedby={errorFor("notes") ? "notes-error" : undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {errorFor("notes") && (
          <p id="notes-error" className="text-sm text-destructive">
            {errorFor("notes")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2.5">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            aria-invalid={errorFor("consent") ? true : undefined}
            aria-describedby={errorFor("consent") ? "consent-error" : undefined}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed text-muted-foreground">
            I agree that my details may be shared with this clinic to confirm the appointment.
          </label>
        </div>
        {errorFor("consent") && (
          <p id="consent-error" className="text-sm text-destructive">
            {errorFor("consent")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Confirming…" : "Confirm booking"}
        </Button>
        <Link href={backHref} className={buttonClasses("outline", "md")}>
          Back
        </Link>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  ...props
}: {
  name: string;
  label: string;
  error?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        // aria-invalid marks the field itself as wrong; aria-describedby ties
        // the message to it, so a screen reader reads both together.
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
