import type { ReactElement } from "react";
import type { DocumentKey } from "@/content/types";

type DocumentSilhouetteProps = {
  docKey: DocumentKey;
  /** Sets the size; each placement draws it at its own (spine, tab, page line). */
  className?: string;
};

/** The `wy-sil` glyphs from 03-what-you-get.dc.html, copied path for path. */
const glyphs: Record<DocumentKey, ReactElement> = {
  summary: (
    <>
      <rect x="4" y="3" width="24" height="34" rx="2" />
      <path d="M9 10h14M9 15h9" />
      <path d="M9 21h14" strokeWidth={2.6} />
      <path d="M9 27h14M9 31h14" />
    </>
  ),
  findings: (
    <>
      <rect x="4" y="3" width="24" height="34" rx="2" />
      <path d="M9 8h14M9 11.5h14M9 15h10" />
      <path d="M9 19h14M9 23h14M9 27h14M9 31h14" />
      <path d="M14 19v12M20 19v12" />
    </>
  ),
  arch: (
    <>
      <rect x="4" y="3" width="24" height="34" rx="2" />
      <circle cx="10" cy="11" r="1.6" />
      <path d="M14 11h9M14 15h7" />
      <circle cx="10" cy="22" r="1.6" />
      <path d="M14 22h9M14 26h7" />
      <circle cx="10" cy="32" r="1.6" />
      <path d="M14 32h9" />
    </>
  ),
  roadmap: (
    <>
      <rect x="4" y="3" width="24" height="34" rx="2" />
      <path d="M4 11h24M4 18h24M4 25h24M4 32h24" />
      <path d="M11 3v34M19 3v34" />
    </>
  ),
  set: (
    <>
      <path d="M4 9h8l3 3h13v22H4z" />
      <path d="M10 20h4M10 25h7M10 30h5" />
      <path d="M22 23l4 2.5-4 2.5z" />
    </>
  ),
};

/**
 * A sample document's outline, drawn in the text colour. The width and
 * height attributes are the prototype's default `.wy-sil` size (28×35);
 * every placement overrides them from CSS.
 */
export default function DocumentSilhouette({
  docKey,
  className,
}: DocumentSilhouetteProps) {
  return (
    <svg
      className={className}
      width={28}
      height={35}
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyphs[docKey]}
    </svg>
  );
}
