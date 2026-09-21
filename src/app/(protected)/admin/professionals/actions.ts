"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { professionalSchema } from "@/lib/schemas";
import { getSession, getSessionToken, isAdmin } from "@/lib/session";

export type ProfessionalFormState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: Record<string, string>;
};

const FIELDS = [
  "name",
  "speciality",
  "qualifications",
  "clinic",
  "location",
  "services",
  "availabilitySummary",
  "generalAvailability",
  "summary",
  "photo",
  "photoAlt",
] as const;

function readForm(formData: FormData): Record<string, string> {
  return Object.fromEntries(FIELDS.map((field) => [field, String(formData.get(field) ?? "")]));
}

// Every page under /admin is already gated by its layout, but a Server Action
// is a separate public endpoint - it can be invoked without loading the page.
// So the role is checked here as well, and redirect() stops execution.
async function requireAdmin() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/forbidden");
}

// Editing a professional changes what the public directory shows, so the
// public routes have to be marked stale too - not just the admin list.
function revalidateDirectory(id?: string) {
  revalidatePath("/admin/professionals");
  revalidatePath("/professionals");
  revalidatePath("/");
  if (id) revalidatePath(`/professionals/${id}`);
}

async function send(path: string, method: "POST" | "PATCH", body: unknown) {
  const token = await getSessionToken();

  return fetch(`${process.env.STUB_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function createProfessionalAction(
  _prev: ProfessionalFormState,
  formData: FormData,
): Promise<ProfessionalFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = professionalSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  let response: Response;
  try {
    response = await send("/professionals", "POST", parsed.data);
  } catch {
    return { message: "Could not reach the server. Please try again.", values };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      message: body?.error?.message ?? "The professional could not be added.",
      fields: body?.error?.fields,
      values,
    };
  }

  revalidateDirectory(body?.professional?.id);
  redirect("/admin/professionals?added=1");
}

export async function updateProfessionalAction(
  id: string,
  _prev: ProfessionalFormState,
  formData: FormData,
): Promise<ProfessionalFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = professionalSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  let response: Response;
  try {
    response = await send(`/professionals/${encodeURIComponent(id)}`, "PATCH", parsed.data);
  } catch {
    return { message: "Could not reach the server. Please try again.", values };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return {
      message: body?.error?.message ?? "The changes could not be saved.",
      fields: body?.error?.fields,
      values,
    };
  }

  revalidateDirectory(id);
  redirect("/admin/professionals?saved=1");
}

export type DeleteState = { message?: string };

export async function deleteProfessionalAction(
  id: string,
  _prev: DeleteState,
): Promise<DeleteState> {
  await requireAdmin();

  const token = await getSessionToken();

  let response: Response;
  try {
    response = await fetch(
      `${process.env.STUB_BASE_URL}/professionals/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return { message: "Could not reach the server. Please try again." };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { message: body?.error?.message ?? "The professional could not be removed." };
  }

  revalidateDirectory(id);
  redirect("/admin/professionals?removed=1");
}
