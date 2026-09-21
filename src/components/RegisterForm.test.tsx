import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const registerAction = vi.fn();
vi.mock("@/app/(auth)/register/actions", () => ({
  registerAction: (...args: unknown[]) => registerAction(...args),
}));

import RegisterForm from "@/components/RegisterForm";

beforeEach(() => {
  registerAction.mockReset();
});

async function submit() {
  await userEvent.click(screen.getByRole("button", { name: /create account/i }));
}

describe("RegisterForm", () => {
  it("labels all four fields", () => {
    render(<RegisterForm />);
    for (const label of ["First name", "Last name", "Email", "Password"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("asks the password manager for a NEW password, not the saved one", () => {
    render(<RegisterForm />);
    // The opposite of the login form on purpose: here we want a suggestion,
    // there we want the stored one.
    expect(screen.getByLabelText("Password")).toHaveAttribute("autoComplete", "new-password");
  });

  it("shows every field error at once, each tied to its own box", async () => {
    registerAction.mockResolvedValue({
      message: "Please check the highlighted fields",
      fields: {
        firstName: ["Enter your first name"],
        email: ["Enter a valid email address"],
        password: ["Password must be at least 8 characters"],
      },
    });
    render(<RegisterForm />);

    await submit();

    expect(await screen.findByLabelText("First name")).toHaveAccessibleDescription(
      "Enter your first name",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Password must be at least 8 characters",
    );
  });

  it("puts a duplicate email message on the email field", async () => {
    // The API returns one message for the whole form, so the action places it.
    // This checks the component honours that placement.
    registerAction.mockResolvedValue({
      message: "That email is already registered",
      fields: { email: ["That email is already registered"] },
    });
    render(<RegisterForm />);

    await submit();

    expect(await screen.findByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps the typed names and email, but never the password", async () => {
    registerAction.mockResolvedValue({
      message: "That email is already registered",
      values: { firstName: "Amara", lastName: "Silva", email: "amara@example.com" },
    });
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("Password"), "password1");
    await submit();

    expect(await screen.findByLabelText("First name")).toHaveValue("Amara");
    expect(screen.getByLabelText("Last name")).toHaveValue("Silva");
    expect(screen.getByLabelText("Email")).toHaveValue("amara@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("sends all four fields to the server", async () => {
    registerAction.mockResolvedValue({});
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("First name"), "Amara");
    await userEvent.type(screen.getByLabelText("Last name"), "Silva");
    await userEvent.type(screen.getByLabelText("Email"), "amara@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password1");
    await submit();

    const formData = registerAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("firstName")).toBe("Amara");
    expect(formData.get("lastName")).toBe("Silva");
    expect(formData.get("email")).toBe("amara@example.com");
    expect(formData.get("password")).toBe("password1");
  });
});
