import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Modal from "@/components/Modal";

// role="dialog" plus aria-modal="true" is a promise to assistive technology
// that nothing behind the dialog is reachable. These tests are the promise.
// Every one of them failed before the shared Modal existed.

function Fixture({ onClose = () => {} }: { onClose?: () => void }) {
  return (
    <Modal open onClose={onClose} titleId="t">
      <h2 id="t">Cancel this appointment?</h2>
      <button type="button">Keep appointment</button>
      <button type="button">Yes, cancel it</button>
    </Modal>
  );
}

describe("Modal", () => {
  it("announces itself as a dialog, named by its heading", () => {
    render(<Fixture />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    // Without the accessible name, a screen reader says only "dialog".
    expect(dialog).toHaveAccessibleName("Cancel this appointment?");
  });

  it("renders nothing at all when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} titleId="t">
        <h2 id="t">Hidden</h2>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus inside when it opens", async () => {
    render(<Fixture />);
    // Otherwise a keyboard user opens the dialog and is still outside it,
    // tabbing through the page behind before ever reaching its buttons.
    expect(screen.getByRole("button", { name: "Keep appointment" })).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<Fixture onClose={onClose} />);

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps Tab inside the dialog", async () => {
    render(<Fixture />);
    const keep = screen.getByRole("button", { name: "Keep appointment" });
    const cancel = screen.getByRole("button", { name: "Yes, cancel it" });

    await userEvent.tab();
    expect(cancel).toHaveFocus();

    // At the last control, Tab wraps to the first rather than escaping.
    await userEvent.tab();
    expect(keep).toHaveFocus();
  });

  it("wraps backwards too", async () => {
    render(<Fixture />);
    const cancel = screen.getByRole("button", { name: "Yes, cancel it" });

    await userEvent.tab({ shift: true });
    expect(cancel).toHaveFocus();
  });

  it("gives focus back to whatever opened it", async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal open={open} onClose={() => setOpen(false)} titleId="t">
            <h2 id="t">Confirm</h2>
            <button type="button">Inside</button>
          </Modal>
        </>
      );
    }

    render(<Host />);
    const opener = screen.getByRole("button", { name: "Open" });

    await userEvent.click(opener);
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    // Losing the user's place on the page is disorienting, and for a screen
    // reader user it means starting from the top again.
    expect(opener).toHaveFocus();
  });

  it("closes when the backdrop is clicked, but not the panel", async () => {
    const onClose = vi.fn();
    render(<Fixture onClose={onClose} />);

    await userEvent.click(screen.getByRole("heading", { name: "Cancel this appointment?" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stops the page behind from scrolling while it is open", () => {
    const { unmount } = render(<Fixture />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
