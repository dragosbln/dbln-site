type CalendarIconProps = {
  className?: string;
};

/** Decorative calendar glyph (the home booking card's gate). Inherits color. */
export default function CalendarIcon({ className }: CalendarIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="7" y="10" width="34" height="31" rx="5" />
      <path d="M7 20h34M16 6v8M32 6v8" strokeLinecap="round" />
      <path d="M15 27h3m6 0h3m6 0h1M15 34h3m6 0h3" strokeLinecap="round" />
    </svg>
  );
}
