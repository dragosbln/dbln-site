"use client";

import { useRef, useState } from "react";
import styles from "./ShareButton.module.css";

/** Copies the article URL and confirms with a "Link copied" note. */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs focus + a secure context; fall back to the
      // selection-based copy, which works everywhere.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <button type="button" className={styles.share} onClick={share}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        Share
      </button>
      <span className={copied ? `${styles.note} ${styles.show}` : styles.note} aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}
