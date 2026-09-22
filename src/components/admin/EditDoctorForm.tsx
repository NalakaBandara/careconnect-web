"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import type { DoctorFormState } from "@/app/(protected)/admin/doctors/actions";
import type { Professional } from "@/types";

type Action = (prev: DoctorFormState, formData: FormData) => Promise<DoctorFormState>;

export default function EditDoctorForm({
  action,
  doctor,
}: {
  action: Action;
  doctor: Professional;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: string) => state.fields?.[name]?.[0];

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
        <label htmlFor="bio" className="block text-sm font-medium">
          Profile summary
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          defaultValue={state.values?.bio ?? doctor.summary}
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

      <div className="space-y-1.5">
        <label htmlFor="yearsOfExperience" className="block text-sm font-medium">
          Years of experience
        </label>
        <Input
          id="yearsOfExperience"
          name="yearsOfExperience"
          type="number"
          min={0}
          defaultValue={state.values?.yearsOfExperience ?? doctor.yearsOfExperience ?? ""}
          aria-invalid={errorFor("yearsOfExperience") ? true : undefined}
          aria-describedby={errorFor("yearsOfExperience") ? "yearsOfExperience-error" : undefined}
          className={errorFor("yearsOfExperience") ? "border-destructive" : ""}
        />
        {errorFor("yearsOfExperience") && (
          <p id="yearsOfExperience-error" className="text-sm text-destructive">
            {errorFor("yearsOfExperience")}
          </p>
        )}
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id="isVerified"
          name="isVerified"
          type="checkbox"
          defaultChecked={doctor.isVerified}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <label htmlFor="isVerified" className="text-sm leading-relaxed">
          Licence verified
          <span className="block text-muted-foreground">
            Shown to patients on the public profile, so only tick it once the licence has
            actually been checked.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Link href="/admin/doctors" className={buttonClasses("outline", "md")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
