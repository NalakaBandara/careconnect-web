"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/guards";
import { z } from "zod";
import { createService, retireService, updateService, type ServiceInput } from "@/lib/admin";

export type ServiceFormState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: Record<string, string>;
};

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Enter the service name"),
  description: z.string().trim().max(500, "Please keep this under 500 characters"),
  durationMinutes: z
    .string()
    .trim()
    .refine((v) => Number(v) > 0 && Number(v) <= 480, {
      message: "Enter a length between 1 and 480 minutes",
    }),
});

const FIELDS = ["name", "description", "durationMinutes"] as const;

function readForm(formData: FormData): Record<string, string> {
  return Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
}

// A service is offered on the public services page and chosen when booking,
// so a change has to mark those stale too.
function revalidateEverywhere() {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
}

function toInput(values: { name: string; description: string; durationMinutes: string }): ServiceInput {
  return {
    name: values.name,
    durationMinutes: Number(values.durationMinutes),
    ...(values.description ? { description: values.description } : {}),
  };
}

export async function createServiceAction(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = serviceSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const { error } = await createService(toInput(parsed.data));
  if (error) return { message: error, values };

  revalidateEverywhere();
  redirect("/admin/services?added=1");
}

export async function updateServiceAction(
  id: string,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = serviceSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const { error } = await updateService(id, {
    ...toInput(parsed.data),
    // The form is only shown for active services, so saving one keeps it active.
    status: "ACTIVE",
  });
  if (error) return { message: error, values };

  revalidateEverywhere();
  redirect("/admin/services?saved=1");
}

export type RetireState = { message?: string };

// The API has no DELETE for a service, and retiring is the better behaviour
// anyway: appointments already booked against it keep their record, which a
// hard delete would break. So it is marked INACTIVE and stops being offered.
export async function retireServiceAction(
  input: { id: string; name: string; durationMinutes: number },
  _prev: RetireState,
): Promise<RetireState> {
  await requireAdmin();

  const { error } = await retireService(input.id, {
    name: input.name,
    durationMinutes: input.durationMinutes,
  });
  if (error) return { message: error };

  revalidateEverywhere();
  redirect("/admin/services?retired=1");
}
