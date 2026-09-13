/**
 * Splits a section href for `HashLink`.
 *
 * Returns the href to render and, when it targets a section of the page at
 * `pathname`, the section id. `/#contact` on `/` gives
 * `{ href: "#contact", id: "contact" }`; on `/work` it gives
 * `{ href: "/#contact", id: null }`. A bare `#id` always targets the current
 * page. Hrefs without a hash, with an empty hash, or pointing at another
 * page pass through unchanged.
 */
export function resolveHashHref(
  href: string,
  pathname: string,
): { href: string; id: string | null } {
  const hashAt = href.indexOf("#");
  if (hashAt === -1) return { href, id: null };
  const id = href.slice(hashAt + 1);
  if (id === "") return { href, id: null };
  const path = hashAt === 0 ? pathname : href.slice(0, hashAt);
  if (path !== pathname) return { href, id: null };
  return { href: `#${id}`, id };
}
