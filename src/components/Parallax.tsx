"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Moves a layer slightly as the page scrolls, to suggest depth.
//
// Scroll position genuinely cannot be known on the server, so unlike Reveal
// this one has no CSS-only version. It starts at zero offset, which is exactly
// where the static page already sits - so with JavaScript off it simply does
// not move. Nothing is hidden and nothing jumps.
export default function Parallax({
  children,
  speed = 60,
  className = "",
}: {
  children: ReactNode;
  /** Pixels of travel. Positive moves the layer up as you scroll down. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Respected here rather than in CSS, because the transform is inline.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      // -1 just below the viewport, 0 in the middle, 1 just above it.
      const centre = rect.top + rect.height / 2;
      const progress = (viewport / 2 - centre) / (viewport / 2 + rect.height / 2);

      setOffset(Math.max(-1, Math.min(1, progress)) * speed);
    };

    // Scroll fires far more often than the screen refreshes, so the work is
    // deferred to the next animation frame and coalesced. Without this the
    // main thread does pointless layout reads dozens of times per frame.
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    // passive tells the browser we will not preventDefault, so it can keep
    // scrolling smooth instead of waiting on this listener.
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      // translate3d rather than top/margin: transforms are composited, so they
      // do not force the browser to re-run layout on every frame.
      style={{ transform: `translate3d(0, ${offset.toFixed(2)}px, 0)` }}
    >
      {children}
    </div>
  );
}
