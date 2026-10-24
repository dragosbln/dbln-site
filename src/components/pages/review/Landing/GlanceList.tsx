"use client";

import { useState, type ReactNode } from "react";
import ChevronIcon from "@/components/ChevronIcon";
import type { GlanceDeliverable } from "@/content/types";
import styles from "./Landing.module.css";

type GlanceListProps = {
  /** The block's mono label ("Comes out"). */
  label: string;
  items: GlanceDeliverable[];
  /** The teal line at the foot of the rail. */
  timeline: string;
  /** The strip under the rail, shown only while a row is open. */
  excerptNote: string;
  /** The rail and the two blocks above this one, rendered by the server. */
  children: ReactNode;
};

/**
 * The landing panel's body, with the "Comes out" rows: one deliverable open
 * at a time. It owns the body wrapper, not just the rows: the rail is
 * positioned against a box that ends with the timeline line, and the
 * excerpt note, which this list's state shows, sits outside that box. The
 * blocks above come in as children so they stay server markup. Closed rows
 * keep their detail and excerpt in the HTML, `hidden`.
 */
export default function GlanceList({
  label,
  items,
  timeline,
  excerptNote,
  children,
}: GlanceListProps) {
  const [open, setOpen] = useState<string | null>(null);

  const handleToggle = (num: string) => {
    setOpen((current) => (current === num ? null : num));
  };

  return (
    <>
      <div className={styles.body}>
        {children}
        <div className={`${styles.block} ${styles.blockOut}`}>
          <span className={styles.blockDot} aria-hidden="true" />
          <p className={`${styles.blockLabel} ${styles.blockLabelOut}`}>
            {label}
          </p>
          <ol className={styles.rows}>
            {items.map((item) => {
              const isOpen = open === item.num;
              const panelId = `glance-${item.num}`;
              return (
                <li className={styles.rowItem} key={item.num}>
                  <button
                    type="button"
                    className={styles.row}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => handleToggle(item.num)}
                  >
                    <span className={styles.rowNum}>{item.num}</span>
                    <span className={styles.rowTitle}>{item.title}</span>
                    <span className={styles.chev}>
                      <ChevronIcon />
                    </span>
                  </button>
                  <div id={panelId} className={styles.rowPanel} hidden={!isOpen}>
                    <p className={styles.detail}>{item.detail}</p>
                    <p className={styles.excerpt}>{item.excerpt}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <p className={styles.timeline}>{timeline}</p>
      </div>
      <p className={styles.note} hidden={open === null}>
        {excerptNote}
      </p>
    </>
  );
}
