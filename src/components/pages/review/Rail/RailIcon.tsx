import type { ReactNode } from "react";
import type { RailChipIcon } from "@/content/types";

/** Chip glyphs plus the three group-label glyphs ("What I need" reuses `enter`). */
export type RailIconName = RailChipIcon | "exit" | "warning" | "flag";

/** Paths copied from the prototype (02-how-it-runs.dc.html), 24-unit grid. */
const GLYPHS: Record<RailIconName, ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9" />
      <path d="M16 7l3 3" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  note: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </>
  ),
  rule: (
    <>
      <path d="M5 9h14" />
      <path d="M5 15h14" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" />,
  enter: (
    <>
      <path d="M4 12h11" />
      <path d="M11 8l4 4-4 4" />
      <path d="M19 5v14" />
    </>
  ),
  play: <path d="M8 5v14l11-7z" />,
  exit: (
    <>
      <path d="M5 5v14" />
      <path d="M9 12h11" />
      <path d="M16 8l4 4-4 4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3L2.5 20h19z" />
      <path d="M12 10v4" />
      <path d="M12 17.5h.01" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </>
  ),
};

/** Decorative stroke icon for the rail's chips and chip-group labels. */
export default function RailIcon({ name }: { name: RailIconName }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      // The check is drawn heavier in the prototype; it is the one glyph
      // that reads as a mark rather than an object.
      strokeWidth={name === "check" ? 2.4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  );
}
