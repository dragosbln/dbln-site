"use client";

import { useState } from "react";
import type { ReviewerSection, Testimonial } from "@/content/types";
import styles from "./Reviewer.module.css";

type ReviewSliderProps = {
  items: Testimonial[];
  copy: ReviewerSection["slider"];
};

/** Replaces each `{key}` of a content template ("Review {n} of {total}, {name}"). */
function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values ? String(values[key]) : token,
  );
}

/**
 * "What teams say": one testimonial at a time, chosen with the dots or the
 * looping previous/next buttons.
 *
 * Every quote is rendered, stacked in the same grid cell, and only the
 * active one is visible. The cell takes the tallest quote's height at every
 * width, so the card never resizes when the quote changes and the page
 * below it never moves. The hidden ones keep their box with
 * `visibility: hidden` (not `display: none`, which would drop them from the
 * sizing), and `aria-hidden` + `inert` take them out of the reading order
 * and the tab order. They stay in the HTML for crawlers.
 */
export default function ReviewSlider({ items, copy }: ReviewSliderProps) {
  const [active, setActive] = useState(0);
  const total = items.length;

  function showPrevious() {
    setActive((index) => (index - 1 + total) % total);
  }

  function showNext() {
    setActive((index) => (index + 1) % total);
  }

  return (
    <div className={styles.card} aria-live="polite">
      <p className={`${styles.label} ${styles.sliderLabel}`}>{copy.label}</p>
      <div className={styles.quotes}>
        {items.map((item, index) => {
          const hidden = index !== active;
          return (
            <figure
              key={item.name}
              className={styles.figure}
              aria-hidden={hidden || undefined}
              inert={hidden}
            >
              <span className={styles.mark} aria-hidden="true">
                “
              </span>
              <blockquote className={styles.quote}>
                <p>{item.shortQuote ?? item.quote}</p>
              </blockquote>
              <figcaption className={styles.who}>
                {item.href ? (
                  <a
                    className={styles.author}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className={styles.author}>{item.name}</span>
                )}
                <span className={styles.role}>{item.role}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className={styles.nav}>
        <div className={styles.dots} role="group" aria-label={copy.chooseLabel}>
          {items.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={styles.dot}
              aria-label={fill(copy.reviewLabel, {
                n: index + 1,
                total,
                name: item.name,
              })}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            aria-label={copy.prevLabel}
            onClick={showPrevious}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label={copy.nextLabel}
            onClick={showNext}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
