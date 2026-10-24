type ChevronIconProps = {
  size?: number;
};

/**
 * Decorative down chevron for disclosure rows. Points down at rest; the
 * consumer rotates it when its control is expanded
 * (`[aria-expanded="true"] .chev { transform: rotate(180deg) }`), so the
 * open state lives on the button, not on the icon.
 */
export default function ChevronIcon({ size = 13 }: ChevronIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
