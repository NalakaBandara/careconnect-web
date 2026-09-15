"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A dialog that behaves like one for keyboard and screen-reader users.
//
// role="dialog" and aria-modal="true" are a promise to assistive technology:
// "this is a window, and nothing behind it is reachable". Making that true is
// the job of the code below - the attributes alone do not do it.
//
// Four things every modal owes its user:
//   1. Escape closes it.
//   2. Focus moves into it when it opens, or a keyboard user is still outside.
//   3. Tab stays inside while it is open.
//   4. Focus returns to whatever opened it, so their place is not lost.
export default function Modal({
  open,
  onClose,
  titleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Remember what had focus so it can be given back on close.
    openerRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    // Move focus in. The panel itself is the fallback for a dialog whose
    // content happens to have nothing focusable.
    (focusable()[0] ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      // Trap Tab by wrapping it around the ends of the list.
      const items = focusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    // Stop the page behind scrolling while the dialog is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-5"
      // Clicking the backdrop closes it, which is what people expect. The
      // check keeps a click inside the panel from bubbling up and closing it.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-raised"
      >
        {children}
      </div>
    </div>
  );
}
