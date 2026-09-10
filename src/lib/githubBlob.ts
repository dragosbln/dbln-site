/**
 * GitHub blob URLs as article code references (CodePeek). Pure helpers, no
 * DOM: parse a link, key its file, build the raw-content URL, label a ref.
 * Design contract: ../../../claude_websie/design_handoff_code_peek/README.md.
 */

export type CodeRef = {
  /** The link as written: the exact permalink the pane's footer offers. */
  href: string;
  owner: string;
  repo: string;
  /** Branch, tag or commit sha, as it appears in the URL. */
  gitRef: string;
  /** Repository path, decoded for display. */
  path: string;
  /** First cited line (1-based); undefined for a whole-file reference. */
  start?: number;
  /** Last cited line; equals `start` for a single-line reference. */
  end?: number;
};

// https://github.com/<owner>/<repo>/blob/<ref>/<path>[?query][#L<n>[C<c>][-L<m>[C<c>]]]
// A branch name containing "/" is ambiguous in GitHub's own URL scheme; the
// first segment after /blob/ is taken as the ref, like GitHub does.
const BLOB_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/blob\/([^/#?]+)\/([^#?]+)(?:\?[^#]*)?(?:#L(\d+)(?:C\d+)?(?:-L(\d+)(?:C\d+)?)?)?$/;

const SHA_RE = /^[0-9a-f]{40}$/i;

export function parseGithubBlobUrl(href: string): CodeRef | null {
  const m = BLOB_RE.exec(href);
  if (!m) return null;
  let start = m[5] ? Number(m[5]) : undefined;
  let end = m[6] ? Number(m[6]) : start;
  if (start !== undefined && end !== undefined && end < start) [start, end] = [end, start];
  const rawPath = m[4].replace(/\/+$/, "");
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    /* malformed escape: show the path as written */
  }
  if (!path) return null;
  return { href, owner: m[1], repo: m[2], gitRef: m[3], path, start, end };
}

/** Identity of a file for tabs and the content cache: repo, ref and path. */
export function fileKey(ref: CodeRef): string {
  return `${ref.owner}/${ref.repo}@${ref.gitRef}:${ref.path}`;
}

export function rawContentUrl(ref: CodeRef): string {
  const path = ref.path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${ref.gitRef}/${path}`;
}

/** Commit → short sha; branch or tag → the name as written. */
export function refLabel(gitRef: string): string {
  return SHA_RE.test(gitRef) ? gitRef.slice(0, 7) : gitRef;
}

/** "L50–L53", "L12", or null for a whole-file reference. */
export function rangeLabel(ref: CodeRef): string | null {
  if (ref.start === undefined) return null;
  return ref.end !== undefined && ref.end !== ref.start
    ? `L${ref.start}–L${ref.end}`
    : `L${ref.start}`;
}

export function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/** "src/guard/" for "src/guard/retry.ts"; "" for a root file. */
export function dirName(path: string): string {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i + 1);
}
