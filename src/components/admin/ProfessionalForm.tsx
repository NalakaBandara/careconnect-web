"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import { specialities, locations } from "@/data/professionals";
import type { ProfessionalFormState } from "@/app/(protected)/admin/professionals/actions";
import type { Professional } from "@/types";

type Action = (
  prev: ProfessionalFormState,
  formData: FormData,
) => Promise<ProfessionalFormState>;

// One form for both adding and editing. The only difference is the action it
// posts to and the values it starts with, so two files would be two files to
// keep in step.
export default function ProfessionalForm({
  action,
  professional,
  submitLabel,
}: {
  action: Action;
  professional?: Professional;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: string) => state.fields?.[name]?.[0];

  // After a failed submit, show what was typed. Otherwise fall back to the
  // existing record, or empty for a new one.
  const value = (name: keyof Professional) =>
    state.values?.[name] ?? toFieldValue(professional?.[name]);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Full name" defaultValue={value("name")} error={errorFor("name")} />

        <Select
          name="speciality"
          label="Speciality"
          options={specialities}
          defaultValue={value("speciality")}
          error={errorFor("speciality")}
        />

        <Field
          name="qualifications"
          label="Qualifications"
          defaultValue={value("qualifications")}
          error={errorFor("qualifications")}
        />

        <Field
          name="clinic"
          label="Clinic"
          defaultValue={value("clinic")}
          error={errorFor("clinic")}
        />

        <Select
          name="location"
          label="Location"
          options={locations}
          defaultValue={value("location")}
          error={errorFor("location")}
        />

        <Field
          name="availabilitySummary"
          label="Availability summary"
          defaultValue={value("availabilitySummary")}
          error={errorFor("availabilitySummary")}
        />
      </div>

      <Area
        name="services"
        label="Services"
        hint="One per line"
        rows={4}
        defaultValue={value("services")}
        error={errorFor("services")}
      />

      <Area
        name="generalAvailability"
        label="General availability"
        hint="One per line, for example “Monday to Friday, 09:00 – 17:00”"
        rows={3}
        defaultValue={value("generalAvailability")}
        error={errorFor("generalAvailability")}
      />

      <Area
        name="summary"
        label="Profile summary"
        hint="Shown on the public profile"
        rows={5}
        defaultValue={value("summary")}
        error={errorFor("summary")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="photo"
          label="Photo path"
          hint="For example /professionals/pro-1.jpg"
          defaultValue={value("photo")}
          error={errorFor("photo")}
        />
        <Field
          name="photoAlt"
          label="Photo description"
          hint="Read aloud by screen readers"
          defaultValue={value("photoAlt")}
          error={errorFor("photoAlt")}
        />
      </div>

      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Link href="/admin/professionals" className={buttonClasses("outline", "md")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

// An array field is edited as one-per-line text, so it has to be joined for
// display and split again on the server.
function toFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join("\n");
  return typeof value === "string" ? value : "";
}

function Label({ name, label, hint }: { name: string; label: string; hint?: string }) {
  return (
    <label htmlFor={name} className="block text-sm font-medium">
      {label}
      {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Error({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${name}-error`} className="text-sm text-destructive">
      {error}
    </p>
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
      <Label name={name} label={label} hint={hint} />
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={error ? "border-destructive" : ""}
        {...props}
      />
      <Error name={name} error={error} />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label name={name} label={label} />
      <select
        id={name}
        name={name}
        defaultValue={defaultValue || ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={
          "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
          (error ? "border-destructive" : "border-input")
        }
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Error name={name} error={error} />
    </div>
  );
}

function Area({
  name,
  label,
  hint,
  rows,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  rows: number;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label name={name} label={label} hint={hint} />
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={
          "w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
          (error ? "border-destructive" : "border-input")
        }
      />
      <Error name={name} error={error} />
    </div>
  );
}
