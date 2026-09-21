import { describe, it, expect } from "vitest";

import { bookingSchema, contactSchema, loginSchema, registerSchema } from "@/lib/schemas";

// These rules run in the browser AND on the server, so a mistake here is a
// mistake in both places at once. That is what makes them worth testing
// directly rather than only through the forms.

function fieldErrors(result: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }) {
  return result.error?.flatten().fieldErrors ?? {};
}

describe("registerSchema", () => {
  const valid = {
    firstName: "Amara",
    lastName: "Silva",
    email: "amara@example.com",
    password: "password1",
  };

  it("accepts a complete, valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("names every empty field rather than only the first", () => {
    const result = registerSchema.safeParse({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
    const errors = fieldErrors(result);

    // A form that reports one problem at a time makes people submit four times.
    expect(Object.keys(errors).sort()).toEqual([
      "email",
      "firstName",
      "lastName",
      "password",
    ]);
  });

  it("rejects an address that is not an email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "amara@" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, email: "amara" }).success).toBe(false);
  });

  it("lowercases and trims the email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "  Amara@Example.COM  " });
    expect(result.success && result.data.email).toBe("amara@example.com");
  });

  it("requires eight characters, a letter and a number in the password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "pass1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "passwordonly" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "12345678" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "password1" }).success).toBe(true);
  });

  it("trims a name of spaces before deciding it is empty", () => {
    const result = registerSchema.safeParse({ ...valid, firstName: "   " });
    expect(result.success).toBe(false);
    expect(fieldErrors(result).firstName?.[0]).toBe("Enter your first name");
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("does NOT apply the registration password rules", () => {
    // Deliberate. Telling someone at login that their password is "too short"
    // would describe the password stored on the server to whoever is typing.
    const result = loginSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(result.success).toBe(true);
  });

  it("still requires a password to be typed", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("bookingSchema", () => {
  const valid = {
    fullName: "Amara Silva",
    contactNumber: "07700 900123",
    reason: "Health check-up",
    notes: "",
    consent: "on",
  };

  it("accepts a complete booking", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a booking with the consent box left unticked", () => {
    // An unticked checkbox sends no value at all, so the key is simply absent.
    const { consent, ...withoutConsent } = valid;
    void consent;
    const result = bookingSchema.safeParse(withoutConsent);

    expect(result.success).toBe(false);
    expect(fieldErrors(result).consent?.[0]).toBe(
      "You need to agree before the clinic can be contacted",
    );
  });

  it("rejects a consent value that is anything other than 'on'", () => {
    expect(bookingSchema.safeParse({ ...valid, consent: "true" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, consent: "" }).success).toBe(false);
  });

  it("accepts real phone number punctuation but not letters", () => {
    expect(bookingSchema.safeParse({ ...valid, contactNumber: "+94 (76) 234-5678" }).success).toBe(
      true,
    );
    expect(bookingSchema.safeParse({ ...valid, contactNumber: "call me" }).success).toBe(false);
  });

  it("caps the notes so one person cannot post an essay", () => {
    expect(bookingSchema.safeParse({ ...valid, notes: "x".repeat(500) }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...valid, notes: "x".repeat(501) }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Amara",
    email: "amara@example.com",
    subject: "Listing a clinic",
    message: "We run a small physiotherapy practice and would like to be listed.",
  };

  it("accepts a complete enquiry", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("asks for more than a couple of words in the message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "help" }).success).toBe(false);
  });

  it("caps the message length", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });

  it("reports each empty field separately", () => {
    const result = contactSchema.safeParse({ name: "", email: "", subject: "", message: "" });
    expect(Object.keys(fieldErrors(result)).sort()).toEqual([
      "email",
      "message",
      "name",
      "subject",
    ]);
  });
});
