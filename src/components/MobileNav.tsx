"use client";

import { useState } from "react";
import Link from "next/link";

// Only the toggle needs to be a Client Component. Everything else in the
// header stays server-rendered.
export default function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true">{open ? "\u2715" : "\u2630"}</span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1 rounded-lg border border-border bg-background p-2 shadow-lg"
        >
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-surface">
            Home
          </Link>
          <Link href="/about" className="rounded-md px-3 py-2 hover:bg-surface">
            About
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-surface">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 hover:bg-surface">
                Log in
              </Link>
              <Link href="/register" className="rounded-md px-3 py-2 hover:bg-surface">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
