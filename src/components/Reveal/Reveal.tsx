"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  /** Rendered element — keep semantics ("li" inside lists, etc.). */
  as?: ElementType;
  className?: string;
  id?: string;
  children: ReactNode;
};

/**
 * Scroll-reveal wrapper — the interactive leaf for the `.reveal` utility in
 * globals.css. Progressive enhancement: content is server-rendered visible;
 * only after hydration (html.anim-ready) are below-fold elements hidden and
 * revealed on scroll. No JS, or prefers-reduced-motion => everything visible.
 */
export default function Reveal({
  as: Tag = "div",
  className,
  id,
  children,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    document.documentElement.classList.add("anim-ready");

    // Above the fold: mark visible in the same tick anim-ready lands, so
    // initially visible content never flashes hidden.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={className ? `reveal ${className}` : "reveal"}
    >
      {children}
    </Tag>
  );
}
