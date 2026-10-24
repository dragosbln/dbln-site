"use client";

import { useRef, useState } from "react";
import DocumentPage from "@/components/DocumentPage";
import type {
  DocumentKey,
  DocumentTier,
  SampleDocument,
} from "@/content/types";
import DocumentSilhouette from "./DocumentSilhouette";
import styles from "./Deliverables.module.css";

type DocumentSwitcherProps = {
  tiers: DocumentTier[];
  documents: SampleDocument[];
  pickerLabel: string;
};

function panelId(key: DocumentKey): string {
  return `document-${key}`;
}

/**
 * The document picker and the page it shows. One set of buttons serves both
 * layouts: CSS draws them as the sticky spine column from 900px and as
 * wrapping tabs above the page below it, so no viewport check runs in
 * render. Every document is in the HTML; the unselected ones are `hidden`.
 */
export default function DocumentSwitcher({
  tiers,
  documents,
  pickerLabel,
}: DocumentSwitcherProps) {
  const [selected, setSelected] = useState<DocumentKey>(documents[0].key);
  const shellRef = useRef<HTMLDivElement>(null);
  const byKey = new Map(documents.map((doc) => [doc.key, doc]));

  function handleSelect(key: DocumentKey) {
    setSelected(key);
    // The spines stay stuck while a long document scrolls past them, so a
    // pick made down the page would open the next document mid-way. Only
    // then, bring its top back level with the spines (the shell's
    // scroll-margin-top); html's scroll-behavior makes that smooth, and
    // instant under reduced motion.
    const shell = shellRef.current;
    if (!shell) return;
    const offset = parseFloat(getComputedStyle(shell).scrollMarginTop) || 0;
    if (shell.getBoundingClientRect().top < offset) {
      shell.scrollIntoView({ block: "start" });
    }
  }

  return (
    <div className={styles.grid}>
      <div className={styles.picker} role="group" aria-label={pickerLabel}>
        {tiers.map((tier) => (
          <div className={styles.tier} key={tier.label}>
            <span className={styles.tierLabel}>{tier.label}</span>
            <div className={styles.docs}>
              {tier.docs.map((key) => {
                const doc = byKey.get(key);
                if (!doc) return null;
                return (
                  <button
                    key={key}
                    type="button"
                    className={styles.doc}
                    aria-pressed={key === selected}
                    aria-controls={panelId(key)}
                    onClick={() => handleSelect(key)}
                  >
                    <DocumentSilhouette
                      docKey={key}
                      className={styles.docSil}
                    />
                    <span>
                      <span className={styles.docTitle}>{doc.title}</span>
                      <span className={styles.audience}>{doc.audience}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div ref={shellRef} className={styles.shell}>
        {documents.map((doc) => (
          <div
            key={doc.key}
            id={panelId(doc.key)}
            hidden={doc.key !== selected}
          >
            <p className={styles.for}>
              <DocumentSilhouette docKey={doc.key} className={styles.forSil} />
              <span>{doc.audience}</span>
            </p>
            <DocumentPage document={doc} />
          </div>
        ))}
      </div>
    </div>
  );
}
