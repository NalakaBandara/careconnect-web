import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfessionalForm from "@/components/admin/ProfessionalForm";
import { fetchProfessional } from "@/lib/professionals";
import { updateProfessionalAction } from "../../actions";

export const metadata: Metadata = {
  title: "Edit professional",
  robots: { index: false },
};

export default async function EditProfessionalPage({
  params,
}: PageProps<"/admin/professionals/[professionalId]/edit">) {
  const { professionalId } = await params;
  const professional = await fetchProfessional(professionalId);
  if (!professional) notFound();

  return (
    <div>
      <Link
        href="/admin/professionals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Back to professionals
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">
        Edit {professional.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        The web address stays <code className="text-foreground">/{professional.id}</code> even if
        the name changes, so existing links keep working.
      </p>

      <div className="mt-8 max-w-3xl">
        <ProfessionalForm
          // bind() fixes which record is being edited on the server, so the
          // browser cannot repoint the form at a different professional.
          action={updateProfessionalAction.bind(null, professional.id)}
          professional={professional}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
