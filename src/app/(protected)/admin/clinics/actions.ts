"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClinic, deleteClinic, updateClinic, type ClinicInput } from "@/lib/admin";
import { getSession, isAdmin } from "@/lib/session";

export type ClinicFormState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: Record<string, string>;
};

// The API requires these three and replaces the whole record, so the form
// always sends all of them rather than only what changed.
const clinicSchema = z.object({
  name: z.string().trim().min(1, "Enter the clinic name"),
  addressLine1: z.string().trim().min(1, "Enter the street address"),
  city: z.string().trim().min(1, "Enter the town or city"),
  telephone: z.string().trim(),
  email: z.string().trim(),
  description: z.string().trim().max(500, "Please keep this under 500 characters"),
});

const FIELDS = ["name", "addressLine1", "city", "telephone", "email", "description"] as const;

function readForm(formData: FormData): Record<string, string> {
  return Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
}

// Every admin page is gated by its layout, but a Server Action is its own
// public endpoint: it can be invoked without the page ever being loaded.
async function requireAdmin() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/forbidden");
}

// A clinic appears in the public directory, in the location filter and on
// every professional's profile, so a change has to mark those stale too.
function revalidateEverywhere() {
  revalidatePath("/admin/clinics");
  revalidatePath("/professionals");
  revalidatePath("/");
}

function toInput(values: Record<string, string>): ClinicInput {
  return {
    name: values.name,
    addressLine1: values.addressLine1,
    city: values.city,
    // Empty optional fields are left out rather than sent as "", which would
    // store an empty string where the API expects nothing.
    ...(values.telephone ? { telephone: values.telephone } : {}),
    ...(values.email ? { email: values.email } : {}),
    ...(values.description ? { description: values.description } : {}),
  };
}

export async function createClinicAction(
  _prev: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = clinicSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const { error } = await createClinic(toInput(parsed.data));
  if (error) return { message: error, values };

  revalidateEverywhere();
  redirect("/admin/clinics?added=1");
}

export async function updateClinicAction(
  id: string,
  _prev: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = clinicSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const { error } = await updateClinic(id, toInput(parsed.data));
  if (error) return { message: error, values };

  revalidateEverywhere();
  redirect("/admin/clinics?saved=1");
}

export type DeleteState = { message?: string };

export async function deleteClinicAction(
  id: string,
  _prev: DeleteState,
): Promise<DeleteState> {
  await requireAdmin();

  const { error } = await deleteClinic(id);
  if (error) return { message: error };

  revalidateEverywhere();
  redirect("/admin/clinics?removed=1");
}
