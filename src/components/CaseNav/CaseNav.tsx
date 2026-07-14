"use client";

import { useEffect, useState } from "react";
import styles from "./CaseNav.module.css";

type CaseNavProps = {
  /** Anchor targets in page order. */
  items: { id: string; label: string }[];
};

/**
 * Sticky jump-nav for the case studies. Progressive enhancement: the chips
 * are plain anchor links (smooth scroll + scroll-margin come from CSS);
 * JS only adds the scrollspy highlight.
 */
export default function CaseNav({ items }: CaseNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // First case in page order wins; none in the band (e.g. scrolled
        // back above all cases) clears the highlight.
        setActiveId(items.find((item) => visible.has(item.id))?.id ?? null);
      },
      // A case counts as active while its top sits between the sticky bars
      // and the upper third of the viewport.
      { rootMargin: "-130px 0px -62% 0px", threshold: 0 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <div className={styles.controls}>
      <nav className={styles.inner} aria-label="Case studies">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={
              item.id === activeId ? `${styles.chip} ${styles.on}` : styles.chip
            }
            aria-current={item.id === activeId ? "true" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
