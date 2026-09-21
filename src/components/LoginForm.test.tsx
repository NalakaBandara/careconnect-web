import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The real action reads cookies and calls the API, neither of which exists in
// a test. Mocking it leaves the component's own job under test: taking what
// the server said and putting it in front of the user.
const loginAction = vi.fn();
vi.mock("@/app/(auth)/login/actions", () => ({
  loginAction: (...args: unknown[]) => loginAction(...args),
}));

import LoginForm from "@/components/LoginForm";

beforeEach(() => {
  loginAction.mockReset();
});

async function submit() {
  await userEvent.click(screen.getByRole("button", { name: /log in/i }));
}

describe("LoginForm", () => {
  it("labels every field, so a screen reader can name them", () => {
    render(<LoginForm justRegistered={false} />);

    // getByLabelText only finds a field if the label is properly linked to it.
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("uses the autocomplete value for an existing password, not a new one", () => {
    render(<LoginForm justRegistered={false} />);
    // "new-password" here would make password managers offer to generate one.
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autoComplete",
      "current-password",
    );
  });

  it("shows the server's message in a live region when login fails", async () => {
    loginAction.mockResolvedValue({ message: "Invalid email or password" });
    render(<LoginForm justRegistered={false} />);

    await submit();

    // role="alert" is what makes a screen reader announce it immediately,
    // rather than the user having to go hunting for what went wrong.
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Invalid email or password");
  });

  it("ties a field error to the field it belongs to", async () => {
    loginAction.mockResolvedValue({
      message: "Please check the highlighted fields",
      fields: { email: ["Enter a valid email address"] },
    });
    render(<LoginForm justRegistered={false} />);

    await submit();

    const email = await screen.findByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    // aria-describedby is the link between the box and the message; without it
    // the error is read out as unrelated text somewhere on the page.
    expect(email).toHaveAccessibleDescription("Enter a valid email address");
  });

  it("puts the email back but never the password", async () => {
    loginAction.mockResolvedValue({
      message: "Invalid email or password",
      values: { email: "amara@example.com" },
    });
    render(<LoginForm justRegistered={false} />);

    await userEvent.type(screen.getByLabelText("Password"), "hunter2");
    await submit();

    // Retyping the email after every failure is irritating. Sending the
    // password back to the browser is a different thing entirely.
    expect(await screen.findByLabelText("Email")).toHaveValue("amara@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("confirms a new account was created, when arriving from registration", () => {
    render(<LoginForm justRegistered />);
    expect(screen.getByRole("status")).toHaveTextContent("Account created. Please log in.");
  });

  it("drops that confirmation once there is an error to show instead", async () => {
    loginAction.mockResolvedValue({ message: "Invalid email or password" });
    render(<LoginForm justRegistered />);

    await submit();

    // Two contradictory banners at once would be confusing.
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("sends what was typed to the server", async () => {
    loginAction.mockResolvedValue({});
    render(<LoginForm justRegistered={false} />);

    await userEvent.type(screen.getByLabelText("Email"), "amara@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password1");
    await submit();

    const formData = loginAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("email")).toBe("amara@example.com");
    expect(formData.get("password")).toBe("password1");
  });
});
