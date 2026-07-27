type CommentIconProps = {
  size?: number;
};

/** Decorative speech bubble for comment counts and the comment button. */
export default function CommentIcon({ size = 17 }: CommentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20l1.3-3.9A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}
