"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "scale";

// Fades content in as it scrolls into view.
//
// Two things worth noticing about how this is built:
//
// 1. The hidden state lives in CSS, gated behind [data-js="on"], which a
//    blocking inline script sets before the first paint. So if JavaScript is
//    blocked or fails, nothing is ever hidden - the page is just static.
//    Putting opacity-0 in the JSX instead would server-render an invisible
//    page for those users.
//
// 2. This is a Client Component, but its children are not. A Server Component
//    passed in as `children` is still rendered on the server and ships no
//    JavaScript - only this wrapper does. That is the escape hatch for
//    "I need one interactive shell around static content".
export default function Reveal({
  children,
  as,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  direction?: Direction;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // IntersectionObserver reports when an element enters the viewport without
    // a scroll listener, so the browser does the work off the main thread.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            // Reveal once and stop watching. Re-hiding content the reader has
            // already seen is irritating, and it keeps the observer cheap.
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={direction}
      data-visible={visible ? "true" : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
