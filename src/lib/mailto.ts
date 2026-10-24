/**
 * A `mailto:` URL that opens a prefilled draft. Each field goes through
 * `encodeURIComponent`, so the body's newlines arrive as `%0A` (line breaks
 * in the draft) and a `?`, `&` or `#` in the copy can't cut a field short or
 * start a new one. Not `URLSearchParams`: it encodes spaces as `+`, which
 * mail clients show literally.
 */
export function mailtoHref(
  email: string,
  draft: { subject: string; body: string },
): string {
  const subject = encodeURIComponent(draft.subject);
  const body = encodeURIComponent(draft.body);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
