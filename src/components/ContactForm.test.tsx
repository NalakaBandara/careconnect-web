import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const contactAction = vi.fn();
vi.mock("@/app/contact/actions", () => ({
  contactAction: (...args: unknown[]) => contactAction(...args),
}));

import ContactForm from "@/components/ContactForm";

beforeEach(() => {
  contactAction.mockReset();
});

async function submit() {
  await userEvent.click(screen.getByRole("button", { name: /submit/i }));
}

describe("ContactForm", () => {
  it("labels every field including the message box", () => {
    render(<ContactForm />);
    for (const label of ["Name", "Email", "Subject", "Message"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("replaces the form with a confirmation once the message is sent", async () => {
    contactAction.mockResolvedValue({ ok: true });
    render(<ContactForm />);

    await submit();

    // No redirect on purpose: a /contact/thank-you URL would be reachable by
    // anyone typing it, claiming they had sent something they had not.
    expect(await screen.findByRole("status")).toHaveTextContent("Thank you");
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("announces the confirmation rather than silently swapping the form out", async () => {
    contactAction.mockResolvedValue({ ok: true });
    render(<ContactForm />);

    await submit();

    // Without role="status" a sighted user sees the form vanish and a screen
    // reader user hears nothing at all.
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("keeps the form and shows the error when sending fails", async () => {
    contactAction.mockResolvedValue({
      message: "Could not reach the server. Please try again.",
      values: { name: "Amara", email: "a@b.com", subject: "Hello", message: "A message here." },
    });
    render(<ContactForm />);

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
    // Everything typed is still there, so nothing has to be retyped.
    expect(screen.getByLabelText("Name")).toHaveValue("Amara");
    expect(screen.getByLabelText("Message")).toHaveValue("A message here.");
  });

  it("ties each field error to its field", async () => {
    contactAction.mockResolvedValue({
      message: "Please check the highlighted fields",
      fields: { message: ["Please write at least a sentence so we can help"] },
    });
    render(<ContactForm />);

    await submit();

    expect(await screen.findByLabelText("Message")).toHaveAccessibleDescription(
      "Please write at least a sentence so we can help",
    );
  });
});
