/**
 * Storage boundary for the social backend. Two implementations:
 * FirestoreStore (production) and MemoryStore (unit tests + the local
 * dev harness — the Firestore emulator needs Java, which the dev machine
 * doesn't have). Both must keep the same semantics: a like is a toggle
 * per (slug, subject), every state CHANGE appends an event record, and
 * counters are maintained in the same atomic step as the writes they
 * count, so displayed numbers can never drift from the records.
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

export type CommentStatus = "visible" | "removed";

/** A comment as stored (admin surface sees all of this). */
export type StoredComment = {
  id: string;
  slug: string;
  parentId: string | null;
  name: string;
  body: string;
  subject: string;
  status: CommentStatus;
  depth: number;
  at: string; // ISO timestamp
};

/**
 * A comment as readers see it. Removed comments appear only as bare
 * placeholders, and only while a visible descendant still needs them
 * for thread structure.
 */
export type PublicComment = {
  id: string;
  parentId: string | null;
  depth: number;
  at: string;
  removed: boolean;
  name: string;
  body: string;
};

export type AddCommentInput = {
  slug: string;
  parentId: string | null;
  name: string;
  body: string;
  subject: string;
};

export type AddCommentResult =
  | { ok: true; comment: PublicComment }
  | { ok: false; error: "parent_missing" | "depth_exceeded" | "thread_closed" };

export type LikeEventRecord = {
  slug: string;
  subject: string;
  action: LikeAction;
  at: string;
};

/** Replies nest at most this deep (top level is depth 0). */
export const DEPTH_LIMIT = 4;
/** Hard per-article ceiling so a thread can't grow without bound. */
export const THREAD_LIMIT = 1000;

/**
 * The id + every descendant, from a flat {id, parentId} list. Used by
 * purge, which must take the whole subtree — deleting one node while
 * leaving its replies would orphan them (counted but unrenderable).
 */
export function collectSubtree(
  rootId: string,
  rows: { id: string; parentId: string | null }[],
): Set<string> {
  const subtree = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of rows) {
      if (r.parentId && subtree.has(r.parentId) && !subtree.has(r.id)) {
        subtree.add(r.id);
        grew = true;
      }
    }
  }
  return subtree;
}

export interface SocialStore {
  toggleLike(
    slug: string,
    subject: string,
    action: LikeAction,
  ): Promise<ToggleResult>;
  /** slug → count maps. Slugs with zero may be omitted. */
  getCounts(): Promise<{
    likes: Record<string, number>;
    comments: Record<string, number>;
  }>;
  addComment(input: AddCommentInput): Promise<AddCommentResult>;
  /** Reader view of a thread (visible + structural placeholders). */
  getComments(slug: string): Promise<PublicComment[]>;
  /** Admin (phase 3) + tests. Adjusts the visible counter. */
  setCommentStatus(id: string, status: CommentStatus): Promise<boolean>;
  /** Admin: every comment (removed included), newest first. */
  listComments(opts?: {
    slug?: string;
    limit?: number;
  }): Promise<StoredComment[]>;
  /** Admin: hard delete (GDPR). Decrements the counter if it was visible. */
  purgeComment(id: string): Promise<boolean>;
  /** Admin: recent like events, newest first. */
  listLikeEvents(limit?: number): Promise<LikeEventRecord[]>;
}

export function toPublic(row: StoredComment): PublicComment {
  const removed = row.status === "removed";
  return {
    id: row.id,
    parentId: row.parentId,
    depth: row.depth,
    at: row.at,
    removed,
    name: removed ? "" : row.name,
    body: removed ? "" : row.body,
  };
}

/**
 * The reader view, derived identically by both stores: visible comments,
 * plus removed ones that still have a visible descendant (rendered as
 * placeholders so the thread keeps its shape), sorted oldest-first.
 */
export function toPublicThread(rows: StoredComment[]): PublicComment[] {
  const children = new Map<string, StoredComment[]>();
  for (const row of rows) {
    if (row.parentId) {
      const list = children.get(row.parentId) ?? [];
      list.push(row);
      children.set(row.parentId, list);
    }
  }
  const hasVisibleDescendant = (id: string): boolean =>
    (children.get(id) ?? []).some(
      (c) => c.status === "visible" || hasVisibleDescendant(c.id),
    );
  return rows
    .filter((r) => r.status === "visible" || hasVisibleDescendant(r.id))
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    .map(toPublic);
}

/** In-memory mirror of the Firestore semantics, for tests + harness. */
export class MemoryStore implements SocialStore {
  private states = new Map<
    string,
    { slug: string; subject: string; liked: boolean }
  >();
  private likeCounts = new Map<string, number>();
  private commentCounts = new Map<string, number>();
  private events: {
    slug: string;
    subject: string;
    action: LikeAction;
    at: string;
  }[] = [];
  private comments: StoredComment[] = [];
  private nextId = 1;

  async toggleLike(
    slug: string,
    subject: string,
    action: LikeAction,
  ): Promise<ToggleResult> {
    const key = `${slug}__${subject}`;
    const liked = this.states.get(key)?.liked ?? false;
    const want = action === "like";
    const current = this.likeCounts.get(slug) ?? 0;
    if (liked === want) {
      return { likes: current, liked, changed: false };
    }
    const likes = Math.max(0, current + (want ? 1 : -1));
    this.states.set(key, { slug, subject, liked: want });
    this.likeCounts.set(slug, likes);
    this.events.push({ slug, subject, action, at: new Date().toISOString() });
    return { likes, liked: want, changed: true };
  }

  async getCounts() {
    return {
      likes: Object.fromEntries(this.likeCounts),
      comments: Object.fromEntries(this.commentCounts),
    };
  }

  async addComment(input: AddCommentInput): Promise<AddCommentResult> {
    let depth = 0;
    if (input.parentId) {
      const parent = this.comments.find((c) => c.id === input.parentId);
      if (!parent || parent.slug !== input.slug || parent.status !== "visible") {
        return { ok: false, error: "parent_missing" };
      }
      if (parent.depth >= DEPTH_LIMIT) return { ok: false, error: "depth_exceeded" };
      depth = parent.depth + 1;
    }
    if ((this.commentCounts.get(input.slug) ?? 0) >= THREAD_LIMIT) {
      return { ok: false, error: "thread_closed" };
    }
    const row: StoredComment = {
      id: `c${this.nextId++}`,
      slug: input.slug,
      parentId: input.parentId,
      name: input.name,
      body: input.body,
      subject: input.subject,
      status: "visible",
      depth,
      at: new Date().toISOString(),
    };
    this.comments.push(row);
    this.commentCounts.set(
      input.slug,
      (this.commentCounts.get(input.slug) ?? 0) + 1,
    );
    return { ok: true, comment: toPublic(row) };
  }

  async getComments(slug: string): Promise<PublicComment[]> {
    return toPublicThread(this.comments.filter((c) => c.slug === slug));
  }

  async setCommentStatus(id: string, status: CommentStatus): Promise<boolean> {
    const row = this.comments.find((c) => c.id === id);
    if (!row) return false;
    if (row.status !== status) {
      const delta = status === "removed" ? -1 : 1;
      this.commentCounts.set(
        row.slug,
        Math.max(0, (this.commentCounts.get(row.slug) ?? 0) + delta),
      );
      row.status = status;
    }
    return true;
  }

  async listComments(opts: { slug?: string; limit?: number } = {}) {
    const rows = this.comments
      .filter((c) => !opts.slug || c.slug === opts.slug)
      .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
    return (opts.limit ? rows.slice(0, opts.limit) : rows).map((c) => ({
      ...c,
    }));
  }

  async purgeComment(id: string): Promise<boolean> {
    const target = this.comments.find((c) => c.id === id);
    if (!target) return false;
    const subtree = collectSubtree(id, this.comments);
    const visibleDeleted = this.comments.filter(
      (c) => subtree.has(c.id) && c.status === "visible",
    ).length;
    this.comments = this.comments.filter((c) => !subtree.has(c.id));
    this.commentCounts.set(
      target.slug,
      Math.max(0, (this.commentCounts.get(target.slug) ?? 0) - visibleDeleted),
    );
    return true;
  }

  async listLikeEvents(limit = 100): Promise<LikeEventRecord[]> {
    return this.events.slice(-limit).reverse();
  }

  /** Harness/test introspection: the records behind the counts. */
  dump() {
    return {
      counts: Object.fromEntries(this.likeCounts),
      commentCounts: Object.fromEntries(this.commentCounts),
      states: [...this.states.values()],
      events: [...this.events],
      comments: [...this.comments],
    };
  }
}
