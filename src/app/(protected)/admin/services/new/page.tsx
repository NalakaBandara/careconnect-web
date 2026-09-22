import type { Metadata } from "next";
import Link from "next/link";
import ServiceForm from "@/components/admin/ServiceForm";
import { createServiceAction } from "../actions";

export const metadata: Metadata = { title: "Add a service", robots: { index: false } };

export default function NewServicePage() {
  return (
    <div>
      <Link href="/admin/services" className="text-sm text-muted-foreground hover:text-foreground">
        Back to services
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Add a service</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Every appointment is booked against a service, and its length decides how long the
        patient is booked in for.
      </p>

      <div className="mt-8">
        <ServiceForm action={createServiceAction} submitLabel="Add service" />
      </div>
    </div>
  );
}
