"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import type { DoctorFormState } from "@/app/(protected)/admin/doctors/actions";
import type { AdminUser } from "@/lib/admin";
import type { Clinic, Speciality } from "@/types";

type Action = (prev: DoctorFormState, formData: FormData) => Promise<DoctorFormState>;

// Adding a doctor means promoting somebody who already has an account, so this
// starts by choosing a registered user rather than typing a name. That is the
// API's model, and it is the sensible one: the doctor needs a login anyway.
export default function PromoteDoctorForm({
  action,
  users,
  clinics,
  specialities,
}: {
  action: Action;
  users: AdminUser[];
  clinics: Clinic[];
  specialities: Speciality[];
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: string) => state.fields?.[name]?.[0];
  const value = (name: string) => state.values?.[name] ?? "";

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="userId" className="block text-sm font-medium">
          Registered user
        </label>
        <select
          id="userId"
          name="userId"
          defaultValue={value("userId")}
          aria-invalid={errorFor("userId") ? true : undefined}
          aria-describedby={errorFor("userId") ? "userId-error" : undefined}
          className={
            "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
            (errorFor("userId") ? "border-destructive" : "border-input")
          }
        >
          <option value="">Choose a user…</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.email})
            </option>
          ))}
        </select>
        {errorFor("userId") ? (
          <p id="userId-error" className="text-sm text-destructive">
            {errorFor("userId")}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only people who already have an account appear here. Anyone listed as a doctor
            already is left out.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="licenseNumber"
          label="Licence number"
          defaultValue={value("licenseNumber")}
          error={errorFor("licenseNumber")}
        />
        <Field
          name="yearsOfExperience"
          label="Years of experience"
          hint="Optional"
          type="number"
          min={0}
          defaultValue={value("yearsOfExperience")}
          error={errorFor("yearsOfExperience")}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="block text-sm font-medium">
          Profile summary <span className="font-normal text-muted-foreground">Optional</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={value("bio")}
          aria-invalid={errorFor("bio") ? true : undefined}
          aria-describedby={errorFor("bio") ? "bio-error" : undefined}
          className={
            "w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
            (errorFor("bio") ? "border-destructive" : "border-input")
          }
        />
        {errorFor("bio") && (
          <p id="bio-error" className="text-sm text-destructive">
            {errorFor("bio")}
          </p>
        )}
      </div>

      {/* A fieldset with a legend, so a screen reader announces what the group
          of checkboxes is for before reading the boxes themselves. */}
      <CheckboxGroup
        legend="Specialities"
        name="specialtyIds"
        options={specialities.map((s) => ({ id: s.id, label: s.name }))}
        empty="No specialities have been set up yet."
      />

      <CheckboxGroup
        legend="Clinics"
        name="clinicIds"
        options={clinics.map((c) => ({ id: c.id, label: c.name }))}
        empty="No clinics have been set up yet."
        hint="A doctor with no clinic cannot be booked, because appointments are made at a clinic."
      />

      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add doctor"}
        </Button>
        <Link href="/admin/doctors" className={buttonClasses("outline", "md")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function CheckboxGroup({
  legend,
  name,
  options,
  empty,
  hint,
}: {
  legend: string;
  name: string;
  options: { id: string; label: string }[];
  empty: string;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}

      {options.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                value={option.id}
                className="h-4 w-4 accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
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
