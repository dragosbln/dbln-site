/**
 * How a content href renders. `mailto:` and `tel:` hand off to the visitor's
 * own apps and `http(s)://` leaves the site (in a new tab), so both are plain
 * anchors; everything else is a page or section of this site and goes
 * through `HashLink`, which handles `/page#section` and falls back to `Link`.
 */
export type HrefKind = "mailto" | "external" | "internal";

export function hrefKind(href: string): HrefKind {
  if (/^(mailto|tel):/i.test(href)) return "mailto";
  if (/^https?:\/\//i.test(href)) return "external";
  return "internal";
}
