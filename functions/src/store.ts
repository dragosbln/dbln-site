/**
 * Storage boundary for the social backend. Two implementations:
 * FirestoreStore (production) and MemoryStore (unit tests + the local
 * dev harness — the Firestore emulator needs Java, which the dev machine
 * doesn't have). Both must keep the same semantics: a like is a toggle
 * per (slug, subject), every state CHANGE appends an event record, and
 * the displayed count is maintained in the same atomic step as the
 * state + event so it can never drift from the records.
 */

export type LikeAction = "like" | "unlike";

export type ToggleResult = {
  /** Fresh like count for the slug after this request. */
  likes: number;
  /** The subject's like state after this request. */
  liked: boolean;
  /** False when the request was a no-op (state already matched). */
  changed: boolean;
};

export interface SocialStore {
  toggleLike(
    slug: string,
    subject: string,
    action: LikeAction,
  ): Promise<ToggleResult>;
  /** slug → like count. Slugs with zero likes may be omitted. */
  getLikeCounts(): Promise<Record<string, number>>;
}

type MemoryState = { slug: string; subject: string; liked: boolean };
type MemoryEvent = {
  slug: string;
  subject: string;
  action: LikeAction;
  at: string;
};

/** In-memory mirror of the Firestore semantics, for tests + harness. */
export class MemoryStore implements SocialStore {
  private states = new Map<string, MemoryState>();
  private counts = new Map<string, number>();
  private events: MemoryEvent[] = [];

  async toggleLike(
    slug: string,
    subject: string,
    action: LikeAction,
  ): Promise<ToggleResult> {
    const key = `${slug}__${subject}`;
    const liked = this.states.get(key)?.liked ?? false;
    const want = action === "like";
    const current = this.counts.get(slug) ?? 0;
    if (liked === want) {
      return { likes: current, liked, changed: false };
    }
    const likes = Math.max(0, current + (want ? 1 : -1));
    this.states.set(key, { slug, subject, liked: want });
    this.counts.set(slug, likes);
    this.events.push({ slug, subject, action, at: new Date().toISOString() });
    return { likes, liked: want, changed: true };
  }

  async getLikeCounts(): Promise<Record<string, number>> {
    return Object.fromEntries(this.counts);
  }

  /** Harness/test introspection: the records behind the counts. */
  dump() {
    return {
      counts: Object.fromEntries(this.counts),
      states: [...this.states.values()],
      events: [...this.events],
    };
  }
}
