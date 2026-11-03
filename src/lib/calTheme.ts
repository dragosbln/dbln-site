/**
 * Paper-token theme for the embedded Cal.com booker, shared by every booking
 * surface (`BookingFlow` on /review and /work, the home page's calendar
 * gate). Colors only — the booker's fonts are Cal's own and cannot be themed
 * from outside the iframe. Literal values, not `var(--…)`: they travel into
 * the iframe as a postMessage, where the site's tokens don't exist.
 */
export const CAL_CSS_VARS: Record<string, string> = {
  "cal-brand": "#0c7b72",
  "cal-brand-emphasis": "#0a5b55",
  "cal-brand-text": "#ffffff",
  "cal-bg": "#f6f4ef",
  "cal-bg-emphasis": "#e4efec",
  "cal-bg-subtle": "#efece4",
  "cal-bg-muted": "#efece4",
  "cal-border": "#d9d5cb",
  "cal-border-subtle": "#d9d5cb",
  "cal-border-muted": "#e5e2d9",
  "cal-border-booker": "#f6f4ef",
  "cal-text": "#4a4d52",
  "cal-text-emphasis": "#17191c",
  "cal-text-subtle": "#6b6e73",
  "cal-text-muted": "#8a8c8f",
};
