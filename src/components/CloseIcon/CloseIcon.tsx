type CloseIconProps = {
  size?: number;
};

/** Decorative × used in close buttons (peek popover, diagram lightbox). */
export default function CloseIcon({ size = 12 }: CloseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
