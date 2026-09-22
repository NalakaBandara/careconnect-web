"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import type { DoctorFormState } from "@/app/(protected)/admin/doctors/actions";
import type { Clinic } from "@/types";

type Action = (prev: DoctorFormState, formData: FormData) => Promise<DoctorFormState>;

const DAYS = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
] as const;

// A schedule is recurring weekly hours, not a date: "Mondays 9 to 12 at the
// City Clinic, in 30 minute slots". Bookable days come from combining that
// with the calendar.
export default function ScheduleForm({
  action,
  clinics,
}: {
  action: Action;
  clinics: Clinic[];
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: string) => state.fields?.[name]?.[0];
  const value = (name: string, fallback = "") => state.values?.[name] ?? fallback;

  if (clinics.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border-strong bg-surface p-6 text-sm text-muted-foreground">
        Add a clinic first. Working hours are always at a particular clinic.
      </p>
    );
  }

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
        <Select
          name="clinicId"
          label="Clinic"
          defaultValue={value("clinicId")}
          error={errorFor("clinicId")}
          options={clinics.map((c) => [c.id, c.name] as const)}
          placeholder="Choose a clinic…"
        />
        <Select
          name="dayOfWeek"
          label="Day of the week"
          defaultValue={value("dayOfWeek")}
          error={errorFor("dayOfWeek")}
          options={DAYS}
          placeholder="Choose a day…"
        />
        <Field
          name="startTime"
          label="Starts"
          type="time"
          defaultValue={value("startTime", "09:00")}
          error={errorFor("startTime")}
        />
        <Field
          name="endTime"
          label="Finishes"
          type="time"
          defaultValue={value("endTime", "12:00")}
          error={errorFor("endTime")}
        />
      </div>

      <Select
        name="slotDurationMinutes"
        label="Appointment length"
        defaultValue={value("slotDurationMinutes", "30")}
        error={errorFor("slotDurationMinutes")}
        options={[
          ["15", "15 minutes"],
          ["20", "20 minutes"],
          ["30", "30 minutes"],
          ["45", "45 minutes"],
          ["60", "1 hour"],
        ]}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add working hours"}
      </Button>
    </form>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
  error,
  placeholder,
}: {
  name: string;
  label: string;
  options: readonly (readonly [string, string])[];
  defaultValue?: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
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
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  error,
  ...props
}: { name: string; label: string; error?: string } & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
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
