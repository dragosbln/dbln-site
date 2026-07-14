"use client";

import ShareIcon from "@/components/ShareIcon";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import styles from "./ShareButton.module.css";

/** Copies the article URL and confirms with a "Link copied" note. */
export default function ShareButton() {
  const { copied, copy } = useCopyToClipboard(1800);

  const share = () => {
    // Copy the clean article URL: no preview-only ".html", no #fragment a
    // heading-anchor click may have left in the address bar.
    copy(location.origin + location.pathname.replace(/\.html$/, ""));
  };

  return (
    <>
      <button type="button" className={styles.share} onClick={share}>
        <ShareIcon />
        Share
      </button>
      <span className={copied ? `${styles.note} ${styles.show}` : styles.note} aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}
