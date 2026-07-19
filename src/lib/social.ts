/**
 * Client helpers for the first-party social API (same-origin /api,
 * rewritten by Firebase Hosting to the backend function). The storage
 * keys are enumerated in the privacy notice — add one and the notice
 * moves with it:
 * - localStorage "dbln:device": anonymous per-browser id (`d_<uuid>`),
 *   minted on the first like press, never on page view.
 * - localStorage "dbln:liked": map of slugs this browser likes, so the
 *   button stays lit across visits without asking the server.
 */

const DEVICE_KEY = "dbln:device";
const LIKED_KEY = "dbln:liked";

export type LikeResponse = { likes: number; liked: boolean };

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
    // Storage unavailable: likes still work, they just won't persist.
  }
}

/** The browser's anonymous id, created on first use (a like press). */
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

/** slug → like count. Missing slugs mean zero. */
export async function fetchLikeCounts(): Promise<Record<string, number>> {
  const res = await fetch("/api/social/counts");
  if (!res.ok) throw new Error(`counts ${res.status}`);
  const data: unknown = await res.json();
  const likes = (data as { likes?: unknown }).likes;
  if (!likes || typeof likes !== "object") throw new Error("counts shape");
  return likes as Record<string, number>;
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
