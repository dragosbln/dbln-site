/**
 * Comment bodies are plain text, and links are the one markup they carry:
 * `[words](https://…)` renders as a link reading "words" (so a title can
 * stand in for the URL), and a bare http(s) URL renders as itself.
 *
 * Parsed at render time, never stored: the body in the database is exactly
 * what the visitor typed, the server's link cap (it counts "http(s)://")
 * still applies, and older comments pick up clickable links with no
 * migration. Only absolute http(s) URLs become links — no javascript:,
 * data: or relative hrefs — and every other character stays text that
 * React escapes. No node or path-alias imports: the content tests import
 * this file directly.
 */

export type CommentPart =
  | { type: "text"; value: string }
  | { type: "link"; text: string; href: string };

// [text](url), with one level of balanced parentheses allowed inside the
// URL (Wikipedia-style), OR a bare URL.
const LINK_RE =
  /\[([^\]\n]{1,200})\]\((https?:\/\/[^\s()<>]+(?:\([^\s()<>]*\)[^\s()<>]*)*)\)|(https?:\/\/[^\s<>"'`]+)/gi;

/** An absolute http(s) URL with a host, normalized; anything else is null. */
function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.hostname ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * A bare URL ends where prose punctuation begins: "see https://a.b/c." links
 * "https://a.b/c". A closing parenthesis stays only when it closes one
 * opened inside the URL, so "(https://a.b/c)" doesn't swallow the ")".
 */
function splitTrailing(url: string): [string, string] {
  let end = url.length;
  while (end > 0) {
    const ch = url[end - 1];
    if (".,;:!?".includes(ch)) {
      end--;
      continue;
    }
    if (ch === ")") {
      const head = url.slice(0, end);
      const opens = head.split("(").length - 1;
      const closes = head.split(")").length - 1;
      if (closes > opens) {
        end--;
        continue;
      }
    }
    break;
  }
  return [url.slice(0, end), url.slice(end)];
}

export function parseCommentLinks(body: string): CommentPart[] {
  const parts: CommentPart[] = [];
  const pushText = (value: string) => {
    if (!value) return;
    const prev = parts[parts.length - 1];
    if (prev?.type === "text") prev.value += value;
    else parts.push({ type: "text", value });
  };

  let last = 0;
  for (const m of body.matchAll(LINK_RE)) {
    const start = m.index ?? 0;
    pushText(body.slice(last, start));
    last = start + m[0].length;

    if (m[1] !== undefined) {
      const href = safeHref(m[2]);
      if (href) parts.push({ type: "link", text: m[1], href });
      else pushText(m[0]);
      continue;
    }
    const [url, trailing] = splitTrailing(m[3]);
    const href = safeHref(url);
    if (href) {
      parts.push({ type: "link", text: url, href });
      pushText(trailing);
    } else {
      pushText(m[0]);
    }
  }
  pushText(body.slice(last));
  return parts;
}
