import type { Metadata } from "next";
import Link from "next/link";
import ClinicForm from "@/components/admin/ClinicForm";
import { createClinicAction } from "../actions";

export const metadata: Metadata = { title: "Add a clinic", robots: { index: false } };

export default function NewClinicPage() {
  return (
    <div>
      <Link href="/admin/clinics" className="text-sm text-muted-foreground hover:text-foreground">
        Back to clinics
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Add a clinic</h1>
      <p className="mt-2 text-muted-foreground">
        It appears in the public directory and the location filter as soon as you save.
      </p>

      <div className="mt-8">
        <ClinicForm action={createClinicAction} submitLabel="Add clinic" />
      </div>
    </div>
  );
}
