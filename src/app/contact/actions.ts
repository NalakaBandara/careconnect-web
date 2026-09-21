"use server";

import { contactSchema } from "@/lib/schemas";

export type ContactState = {
  ok?: boolean;
  message?: string;
  fields?: Record<string, string[]>;
  values?: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
};

export async function contactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const parsed = contactSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${process.env.STUB_BASE_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return { message: "Could not reach the server. Please try again.", values };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      message: body?.error?.message ?? "Your message could not be sent. Please try again.",
      fields: body?.error?.fields,
      values,
    };
  }

  // No redirect here. Staying put and swapping the form for a confirmation
  // keeps the page addressable - there is no /contact/thank-you URL that
  // somebody could land on without having sent anything.
  return { ok: true };
}
