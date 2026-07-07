type LogoProps = {
  className?: string;
};

/** Brand mark. Inherits color; size it from the consumer's stylesheet. */
export default function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 212.3 245.3"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M98.4,210.8H40.7V82.7h57.8c35.3,0,64,28.7,64,64S133.8,210.8,98.4,210.8z M46.7,204.8h51.8c32,0,58-26,58-58s-26-58-58-58H46.7V204.8z" />
      <path d="M92.4,188.7c-1.8,0-3.7-0.1-5.5-0.3c-1.6-0.2-2.8-1.7-2.6-3.3c0.2-1.6,1.7-2.8,3.3-2.6c14,1.7,28-4.2,36.6-15.4c1-1.3,2.9-1.6,4.2-0.6c1.3,1,1.6,2.9,0.6,4.2C120.3,182.1,106.6,188.7,92.4,188.7z" />
      <path d="M106.7,122.9c-1,0-2-0.5-2.6-1.5c-0.8-1.4-0.3-3.3,1.1-4.1C118,109.8,126,95.9,126,81c0-23.1-18.8-42-42-42c-1.7,0-3-1.3-3-3s1.3-3,3-3c26.5,0,48,21.5,48,48c0,17-9.1,32.9-23.9,41.5C107.7,122.8,107.2,122.9,106.7,122.9z" />
      <circle cx="87.2" cy="125.1" r="5" />
    </svg>
  );
}
