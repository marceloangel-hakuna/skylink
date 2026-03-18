"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reveal — scroll-triggered entrance animation using IntersectionObserver.
 * Adds `.is-revealed` class when the element enters the viewport, which
 * triggers the CSS transition defined in globals.css (.reveal-wrap).
 *
 * Usage:
 *   <Reveal>
 *     <MyCard />
 *   </Reveal>
 *
 * With stagger delay (ms):
 *   <Reveal delay={80}>…</Reveal>
 *
 * With scale variant:
 *   <Reveal variant="scale">…</Reveal>
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className,
}: {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "scale";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If motion is reduced, reveal immediately without animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${variant === "scale" ? "reveal-scale" : "reveal-wrap"}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
