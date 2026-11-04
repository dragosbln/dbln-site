"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Story.module.css";

type StoryRailProps = {
  /** The nav's aria-label and the two button labels. */
  nav: { label: string; back: string; next: string };
  /** aria-label of the scrolling region. */
  railLabel: string;
  /** Live status line; `{name}` interpolates the settled card's name. */
  status: string;
  /** One name per card, in rail order. */
  names: string[];
  /** The cards, each marked `data-card`. */
  children: ReactNode;
};

/** How long after the last scroll event the rail counts as settled. */
const SETTLE_MS = 140;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cardsOf = (rail: HTMLElement) =>
  Array.from(rail.querySelectorAll<HTMLElement>("[data-card]"));

/**
 * The story's scroll rail: native horizontal scrolling with snap points,
 * Back/Next buttons that step by card (the trigger is narrower than the
 * steps, so steps are measured, never assumed), and the edge fades.
 *
 * The fades live in the rail's outer gutters (negative margin, matching
 * padding and scroll padding), so a snapped card's box, border included,
 * stays outside the faded area; their widths follow the scroll position
 * and shrink to nothing at either end, where the matching button is
 * disabled, so the boundaries read as reached. Moves respect
 * prefers-reduced-motion. A visually hidden live line names the settled
 * card for screen readers.
 */
export default function StoryRail({
  nav,
  railLabel,
  status,
  names,
  children,
}: StoryRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [active, setActive] = useState(0);
  /** The settled card, for the resize handler (state would be stale there). */
  const activeRef = useRef(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = cardsOf(rail);
    if (cards.length === 0) return;
    let settle: number | undefined;

    const update = () => {
      const remaining = Math.max(
        0,
        rail.scrollWidth - rail.clientWidth - rail.scrollLeft,
      );
      const gutter =
        parseFloat(getComputedStyle(rail).getPropertyValue("--rail-gutter")) ||
        0;
      const fade = Math.max(0, gutter - 2);
      setAtStart(rail.scrollLeft < 2);
      setAtEnd(remaining < 3);
      // Runtime values for the mask in Story.module.css, not style rules:
      // the fades follow the scroll position.
      rail.style.setProperty(
        "--fade-left",
        `${Math.min(fade, Math.max(0, rail.scrollLeft))}px`,
      );
      rail.style.setProperty("--fade-right", `${Math.min(fade, remaining)}px`);
    };

    const settled = () => {
      if (rail.scrollLeft < 2) return 0;
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3) {
        return cards.length - 1;
      }
      const first = cards[0].offsetLeft;
      let best = 0;
      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - first - rail.scrollLeft);
        const bestDistance = Math.abs(
          cards[best].offsetLeft - first - rail.scrollLeft,
        );
        if (distance < bestDistance) best = index;
      });
      return best;
    };

    const onScroll = () => {
      update();
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const index = settled();
        activeRef.current = index;
        setActive(index);
      }, SETTLE_MS);
    };

    rail.addEventListener("scroll", onScroll, { passive: true });
    // A resize (or a font load) moves the card offsets; keep the settled
    // card in place rather than letting it drift under the fades.
    const observer = new ResizeObserver(() => {
      rail.scrollTo({
        left: cards[activeRef.current].offsetLeft - cards[0].offsetLeft,
        behavior: "instant",
      });
      update();
    });
    observer.observe(rail);
    update();
    return () => {
      rail.removeEventListener("scroll", onScroll);
      observer.disconnect();
      window.clearTimeout(settle);
    };
  }, []);

  const move = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = cardsOf(rail);
    if (cards.length === 0) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const offsets = cards.map((card) =>
      Math.min(card.offsetLeft - cards[0].offsetLeft, maxScroll),
    );
    const target =
      direction > 0
        ? offsets.find((offset) => offset > rail.scrollLeft + 3)
        : [...offsets].reverse().find((offset) => offset < rail.scrollLeft - 3);
    rail.scrollTo({
      left: target ?? (direction > 0 ? maxScroll : 0),
      behavior: reducedMotion() ? "instant" : "smooth",
    });
  };

  return (
    <>
      <div className={styles.nav}>
        <nav className={styles.arrows} aria-label={nav.label}>
          <button
            type="button"
            className={styles.arrow}
            disabled={atStart}
            onClick={() => move(-1)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {nav.back}
          </button>
          <button
            type="button"
            className={styles.arrow}
            disabled={atEnd}
            onClick={() => move(1)}
          >
            {nav.next}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>
      </div>
      <div
        ref={railRef}
        className={styles.rail}
        role="region"
        aria-label={railLabel}
      >
        {children}
      </div>
      <p className={styles.sr} aria-live="polite">
        {status.replace("{name}", names[active] ?? names[0])}
      </p>
    </>
  );
}
