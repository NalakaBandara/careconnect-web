import type { Metadata } from "next";
import Link from "next/link";
import ProfessionalForm from "@/components/admin/ProfessionalForm";
import { createProfessionalAction } from "../actions";

export const metadata: Metadata = {
  title: "Add a professional",
  robots: { index: false },
};

export default function NewProfessionalPage() {
  return (
    <div>
      <Link
        href="/admin/professionals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Back to professionals
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Add a professional</h1>
      <p className="mt-2 text-muted-foreground">
        They appear in the public directory as soon as you save.
      </p>

      <div className="mt-8 max-w-3xl">
        <ProfessionalForm action={createProfessionalAction} submitLabel="Add professional" />
      </div>
    </div>
  );
}
