"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import type { ServiceFormState } from "@/app/(protected)/admin/services/actions";
import type { Service } from "@/types";

type Action = (prev: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;

// One form for adding and for editing, since the only differences are the
// action it posts to and the values it starts with.
export default function ServiceForm({
  action,
  service,
  submitLabel,
}: {
  action: Action;
  service?: Service;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: string) => state.fields?.[name]?.[0];
  const value = (name: string, existing?: string | number | null) =>
    state.values?.[name] ?? (existing != null ? String(existing) : "");

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

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">
          Service name
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={value("name", service?.name)}
          aria-invalid={errorFor("name") ? true : undefined}
          aria-describedby={errorFor("name") ? "name-error" : undefined}
          className={errorFor("name") ? "border-destructive" : ""}
        />
        {errorFor("name") && (
          <p id="name-error" className="text-sm text-destructive">
            {errorFor("name")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="durationMinutes" className="block text-sm font-medium">
          Appointment length
          <span className="ml-2 font-normal text-muted-foreground">In minutes</span>
        </label>
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={1}
          max={480}
          defaultValue={value("durationMinutes", service?.durationMinutes ?? 30)}
          aria-invalid={errorFor("durationMinutes") ? true : undefined}
          aria-describedby={
            errorFor("durationMinutes") ? "durationMinutes-error" : "durationMinutes-hint"
          }
          className={errorFor("durationMinutes") ? "border-destructive" : ""}
        />
        {errorFor("durationMinutes") ? (
          <p id="durationMinutes-error" className="text-sm text-destructive">
            {errorFor("durationMinutes")}
          </p>
        ) : (
          <p id="durationMinutes-hint" className="text-sm text-muted-foreground">
            How long a patient is booked in for. Shown on the booking page.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="font-normal text-muted-foreground">Optional</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={value("description", service?.description)}
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
        <Link href="/admin/services" className={buttonClasses("outline", "md")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
