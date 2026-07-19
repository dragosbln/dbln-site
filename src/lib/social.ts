/**
 * Client helpers for the first-party social API (same-origin /api,
 * rewritten by Firebase Hosting to the backend function). The storage
 * keys are enumerated in the privacy notice — add one and the notice
 * moves with it:
 * - localStorage "dbln:device": anonymous per-browser id (`d_<uuid>`),
 *   minted on the first like or comment, never on page view.
 * - localStorage "dbln:liked": map of slugs this browser likes, so the
 *   button stays lit across visits without asking the server.
 * - localStorage "dbln:name": the name last commented under, so the
 *   form remembers it.
 */

const DEVICE_KEY = "dbln:device";
const LIKED_KEY = "dbln:liked";
const NAME_KEY = "dbln:name";

export type LikeResponse = { likes: number; liked: boolean };

export type SocialCounts = {
  likes: Record<string, number>;
  comments: Record<string, number>;
};

export type PublicComment = {
  id: string;
  parentId: string | null;
  depth: number;
  at: string;
  removed: boolean;
  name: string;
  body: string;
};

export type CommentsPayload = { comments: PublicComment[]; token: string };

/** Survives storage being unavailable (hardened private modes). */
let ephemeralDevice: string | null = null;

function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: things still work, they just won't persist.
  }
}

/** The browser's anonymous id, created on first use (like or comment). */
function mintDeviceId(): string {
  const existing = readStorage(DEVICE_KEY) ?? ephemeralDevice;
  if (existing) return existing;
  const id = `d_${uuid()}`;
  ephemeralDevice = id;
  writeStorage(DEVICE_KEY, id);
  return id;
}

function readLikedMap(): Record<string, true> {
  try {
    const parsed: unknown = JSON.parse(readStorage(LIKED_KEY) ?? "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, true>;
    }
  } catch {
    // Corrupt entry: treat as empty, it self-heals on the next like.
  }
  return {};
}

/**
 * The liked flags form a tiny external store (useSyncExternalStore in
 * EngageBar): the in-memory overlay is the session's source of truth —
 * it keeps the toggle working even when storage writes are blocked
 * (hardened private modes) — and localStorage is the persistence layer.
 */
const likedOverlay = new Map<string, boolean>();
const likedListeners = new Set<() => void>();

export function subscribeLiked(listener: () => void): () => void {
  likedListeners.add(listener);
  return () => likedListeners.delete(listener);
}

export function likedLocally(slug: string): boolean {
  const overlaid = likedOverlay.get(slug);
  if (overlaid !== undefined) return overlaid;
  return readLikedMap()[slug] === true;
}

export function setLikedLocally(slug: string, liked: boolean): void {
  likedOverlay.set(slug, liked);
  const map = readLikedMap();
  if (liked) map[slug] = true;
  else delete map[slug];
  writeStorage(LIKED_KEY, JSON.stringify(map));
  likedListeners.forEach((listener) => listener());
}

/**
 * Cross-component "a comment was just posted here" signal. Carries the
 * poster's view of the new visible TOTAL (it holds the fetched thread),
 * so listeners show a real count instead of guessing with increments.
 */
const commentListeners = new Set<(slug: string, total: number) => void>();

export function subscribeComments(
  listener: (slug: string, total: number) => void,
): () => void {
  commentListeners.add(listener);
  return () => commentListeners.delete(listener);
}

export function notifyCommentAdded(slug: string, total: number): void {
  commentListeners.forEach((listener) => listener(slug, total));
}

export function savedName(): string {
  return readStorage(NAME_KEY) ?? "";
}

export function saveName(name: string): void {
  writeStorage(NAME_KEY, name);
}

/** slug → count maps. Missing slugs mean zero. */
export async function fetchCounts(): Promise<SocialCounts> {
  const res = await fetch("/api/social/counts");
  if (!res.ok) throw new Error(`counts ${res.status}`);
  const data = (await res.json()) as Partial<SocialCounts>;
  if (
    !data.likes ||
    typeof data.likes !== "object" ||
    !data.comments ||
    typeof data.comments !== "object"
  ) {
    throw new Error("counts shape");
  }
  return { likes: data.likes, comments: data.comments };
}

export async function postLike(
  slug: string,
  action: "like" | "unlike",
): Promise<LikeResponse> {
  const res = await fetch("/api/likes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, subject: mintDeviceId(), action }),
  });
  if (!res.ok) throw new Error(`like ${res.status}`);
  return (await res.json()) as LikeResponse;
}

export async function fetchComments(slug: string): Promise<CommentsPayload> {
  const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`comments ${res.status}`);
  const data = (await res.json()) as Partial<CommentsPayload>;
  if (!Array.isArray(data.comments) || typeof data.token !== "string") {
    throw new Error("comments shape");
  }
  return { comments: data.comments, token: data.token };
}

/** Thrown by postComment with the server's error code as `code`. */
export class CommentError extends Error {
  constructor(public code: string) {
    super(`comment ${code}`);
  }
}

export async function postComment(input: {
  slug: string;
  parentId: string | null;
  name: string;
  body: string;
  token: string;
}): Promise<PublicComment> {
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      subject: mintDeviceId(),
      // Honeypot: humans never see this field, so it posts empty.
      website: "",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    comment?: PublicComment;
  };
  if (!res.ok || !data.comment) {
    throw new CommentError(data.error ?? String(res.status));
  }
  return data.comment;
}
