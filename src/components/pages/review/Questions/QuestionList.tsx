"use client";

import { type Ref, useRef, useState } from "react";
import { flushSync } from "react-dom";
import ChevronIcon from "@/components/ChevronIcon";
import type { Question } from "@/content/types";
import styles from "./Questions.module.css";

/** The late rows' wrapper, the panel the "more" row controls. */
const MORE_ID = "questions-more";

type QuestionListProps = {
  items: Question[];
  /** Rows shown before the "more" row; the rest wait, hidden, behind it. */
  visibleCount: number;
  moreLabel: string;
};

type QuestionRowProps = {
  item: Question;
  open: boolean;
  onToggle: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};

function QuestionRow({ item, open, onToggle, buttonRef }: QuestionRowProps) {
  const panelId = `question-${item.num}`;
  return (
    <div className={styles.row}>
      {/* Each question is an h3 under the section's h2, so the outline lists
          them; the disclosure button lives inside the heading. The number is
          aria-hidden (as SectionHead's) so the heading's name is the question. */}
      <h3 className={styles.q}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.num} aria-hidden="true">
            {item.num}
          </span>
          <span className={styles.text}>{item.q}</span>
          <span className={styles.chev}>
            <ChevronIcon />
          </span>
        </button>
      </h3>
      {/* Closed answers stay in the HTML: the page is a crawler surface. */}
      <div id={panelId} className={styles.answer} hidden={!open}>
        <p>{item.a}</p>
      </div>
    </div>
  );
}

/**
 * The questions accordion: one answer open at a time; rows past
 * `visibleCount` sit behind a "more" row that reveals them and disappears.
 */
export default function QuestionList({
  items,
  visibleCount,
  moreLabel,
}: QuestionListProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const firstLateRef = useRef<HTMLButtonElement>(null);

  const early = items.slice(0, visibleCount);
  const late = items.slice(visibleCount);

  function toggle(num: string, isLate: boolean) {
    setOpen((current) => (current === num ? null : num));
    // Late rows are only clickable once revealed; this keeps the invariant
    // that an open answer is never inside a hidden wrapper.
    if (isLate) setMore(true);
  }

  function handleMore() {
    // The "more" row hides itself, which would drop keyboard focus to
    // <body>. Hand it to the first question it revealed; flushSync commits
    // the unhidden wrapper first so that button can take focus.
    flushSync(() => setMore(true));
    firstLateRef.current?.focus();
  }

  return (
    <div className={styles.list}>
      {early.map((item) => (
        <QuestionRow
          key={item.num}
          item={item}
          open={open === item.num}
          onToggle={() => toggle(item.num, false)}
        />
      ))}
      {late.length > 0 ? (
        <>
          <div className={styles.row} hidden={more}>
            <button
              type="button"
              className={`${styles.toggle} ${styles.more}`}
              aria-expanded={more}
              aria-controls={MORE_ID}
              onClick={handleMore}
            >
              <span className={styles.num} aria-hidden="true">
                +
              </span>
              <span className={styles.text}>{moreLabel}</span>
              <span className={styles.chev}>
                <ChevronIcon />
              </span>
            </button>
          </div>
          <div id={MORE_ID} hidden={!more}>
            {late.map((item, index) => (
              <QuestionRow
                key={item.num}
                item={item}
                open={open === item.num}
                onToggle={() => toggle(item.num, true)}
                buttonRef={index === 0 ? firstLateRef : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
