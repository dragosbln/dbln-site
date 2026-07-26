import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import {
  collectSubtree,
  DEPTH_LIMIT,
  THREAD_LIMIT,
  toPublic,
  toPublicThread,
  type AddCommentInput,
  type AddCommentResult,
  type CommentStatus,
  type LikeAction,
  type LikeEventRecord,
  type PublicComment,
  type SocialStore,
  type StoredComment,
  type ToggleResult,
} from "./store";

/**
 * Production store. Collections:
 * - likeEvents/{auto}: append-only record of every state-changing press
 *   ({slug, subject, action, at}). Never updated, never deleted by code.
 * - likeStates/{slug}__{subject}: the subject's current toggle state —
 *   what makes a like idempotent per browser (later: per account).
 * - comments/{auto}: {slug, parentId, name, body, subject, status,
 *   depth, at}. Soft-removed via status (admin), never edited by code.
 * - meta/counters: {likes: {slug: n}, comments: {slug: n}} — displayed
 *   counts, written in the SAME transaction as the writes they count,
 *   so counts always equal what the records add up to.
 *
 * `subject` is a random client id (`d_<uuid>`), never an IP, never a
 * name. See AGENTS.md "Social backend".
 */
export class FirestoreStore implements SocialStore {
  constructor(private db: Firestore) {}

  private countersRef() {
    return this.db.collection("meta").doc("counters");
  }

  async toggleLike(
    slug: string,
    subject: string,
    action: LikeAction,
  ): Promise<ToggleResult> {
    const stateRef = this.db.collection("likeStates").doc(`${slug}__${subject}`);
    const countersRef = this.countersRef();
    const eventRef = this.db.collection("likeEvents").doc();

    return this.db.runTransaction(async (tx) => {
      const [stateSnap, countersSnap] = await Promise.all([
        tx.get(stateRef),
        tx.get(countersRef),
      ]);
      const liked = stateSnap.exists ? stateSnap.get("liked") === true : false;
      const want = action === "like";
      const counts =
        (countersSnap.get("likes") as Record<string, number> | undefined) ?? {};
      const current = counts[slug] ?? 0;
      if (liked === want) {
        return { likes: current, liked, changed: false };
      }
      const likes = Math.max(0, current + (want ? 1 : -1));
      tx.set(
        stateRef,
        {
          slug,
          subject,
          liked: want,
          updatedAt: FieldValue.serverTimestamp(),
          ...(want && !stateSnap.exists
            ? { firstLikedAt: FieldValue.serverTimestamp() }
            : {}),
        },
        { merge: true },
      );
      tx.create(eventRef, {
        slug,
        subject,
        action,
        at: FieldValue.serverTimestamp(),
      });
      tx.set(countersRef, { likes: { [slug]: likes } }, { merge: true });
      return { likes, liked: want, changed: true };
    });
  }

  async getCounts() {
    const snap = await this.countersRef().get();
    return {
      likes: (snap.get("likes") as Record<string, number> | undefined) ?? {},
      comments:
        (snap.get("comments") as Record<string, number> | undefined) ?? {},
    };
  }

  async addComment(input: AddCommentInput): Promise<AddCommentResult> {
    const countersRef = this.countersRef();
    const newRef = this.db.collection("comments").doc();
    const parentRef = input.parentId
      ? this.db.collection("comments").doc(input.parentId)
      : null;

    return this.db.runTransaction(async (tx) => {
      const [countersSnap, parentSnap] = await Promise.all([
        tx.get(countersRef),
        parentRef ? tx.get(parentRef) : Promise.resolve(null),
      ]);

      let depth = 0;
      if (parentRef) {
        if (
          !parentSnap?.exists ||
          parentSnap.get("slug") !== input.slug ||
          parentSnap.get("status") !== "visible"
        ) {
          return { ok: false as const, error: "parent_missing" as const };
        }
        const parentDepth = (parentSnap.get("depth") as number | undefined) ?? 0;
        if (parentDepth >= DEPTH_LIMIT) {
          return { ok: false as const, error: "depth_exceeded" as const };
        }
        depth = parentDepth + 1;
      }

      const commentCounts =
        (countersSnap.get("comments") as Record<string, number> | undefined) ??
        {};
      const current = commentCounts[input.slug] ?? 0;
      if (current >= THREAD_LIMIT) {
        return { ok: false as const, error: "thread_closed" as const };
      }

      // Timestamp.now() (not serverTimestamp) so the stored value can be
      // returned to the poster in this same request.
      const at = Timestamp.now();
      tx.create(newRef, {
        slug: input.slug,
        parentId: input.parentId,
        name: input.name,
        body: input.body,
        subject: input.subject,
        status: "visible",
        depth,
        at,
      });
      tx.set(
        countersRef,
        { comments: { [input.slug]: current + 1 } },
        { merge: true },
      );

      const row: StoredComment = {
        id: newRef.id,
        slug: input.slug,
        parentId: input.parentId,
        name: input.name,
        body: input.body,
        subject: input.subject,
        status: "visible",
        depth,
        at: at.toDate().toISOString(),
      };
      return { ok: true as const, comment: toPublic(row) };
    });
  }

  private rowFromDoc(doc: FirebaseFirestore.DocumentSnapshot): StoredComment {
    return {
      id: doc.id,
      slug: doc.get("slug") as string,
      parentId: (doc.get("parentId") as string | null) ?? null,
      name: (doc.get("name") as string) ?? "",
      body: (doc.get("body") as string) ?? "",
      subject: (doc.get("subject") as string) ?? "",
      status: (doc.get("status") as CommentStatus) ?? "visible",
      depth: (doc.get("depth") as number) ?? 0,
      at:
        doc.get("at") instanceof Timestamp
          ? (doc.get("at") as Timestamp).toDate().toISOString()
          : new Date(0).toISOString(),
    };
  }

  async getComments(slug: string): Promise<PublicComment[]> {
    // Equality-only query: ordering + the placeholder rule are applied in
    // memory (shared toPublicThread), which keeps parity with MemoryStore
    // and avoids composite-index management for a per-article thread.
    const snap = await this.db
      .collection("comments")
      .where("slug", "==", slug)
      .get();
    return toPublicThread(snap.docs.map((doc) => this.rowFromDoc(doc)));
  }

  async listComments(
    opts: { slug?: string; limit?: number } = {},
  ): Promise<StoredComment[]> {
    if (opts.slug) {
      // Equality-only query + in-memory sort (parity with getComments):
      // a where(slug)+orderBy(at) shape would need a composite index that
      // isn't deployed. Per-article threads are small.
      const snap = await this.db
        .collection("comments")
        .where("slug", "==", opts.slug)
        .get();
      const rows = snap.docs
        .map((doc) => this.rowFromDoc(doc))
        .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
      return opts.limit ? rows.slice(0, opts.limit) : rows;
    }
    // Unfiltered: orderBy(at) uses the auto single-field index.
    let query: FirebaseFirestore.Query = this.db
      .collection("comments")
      .orderBy("at", "desc");
    if (opts.limit) query = query.limit(opts.limit);
    const snap = await query.get();
    return snap.docs.map((doc) => this.rowFromDoc(doc));
  }

  async purgeComment(id: string): Promise<boolean> {
    const ref = this.db.collection("comments").doc(id);
    const countersRef = this.countersRef();
    return this.db.runTransaction(async (tx) => {
      // Reads first (transaction rule), then all writes.
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      const slug = snap.get("slug") as string;
      const siblingsSnap = await tx.get(
        this.db.collection("comments").where("slug", "==", slug),
      );
      const countersSnap = await tx.get(countersRef);

      // Purge the whole subtree — a bare delete would orphan visible
      // replies (unrenderable, but still counted).
      const rows = siblingsSnap.docs.map((doc) => ({
        id: doc.id,
        parentId: (doc.get("parentId") as string | null) ?? null,
        status: doc.get("status") as CommentStatus,
      }));
      const subtree = collectSubtree(id, rows);
      const visibleDeleted = rows.filter(
        (r) => subtree.has(r.id) && r.status === "visible",
      ).length;
      const commentCounts =
        (countersSnap.get("comments") as Record<string, number> | undefined) ??
        {};
      tx.set(
        countersRef,
        {
          comments: {
            [slug]: Math.max(0, (commentCounts[slug] ?? 0) - visibleDeleted),
          },
        },
        { merge: true },
      );
      for (const sid of subtree) {
        tx.delete(this.db.collection("comments").doc(sid));
      }
      return true;
    });
  }

  async listLikeEvents(limit = 100): Promise<LikeEventRecord[]> {
    const snap = await this.db
      .collection("likeEvents")
      .orderBy("at", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((doc) => ({
      slug: doc.get("slug") as string,
      subject: doc.get("subject") as string,
      action: doc.get("action") as LikeAction,
      at:
        doc.get("at") instanceof Timestamp
          ? (doc.get("at") as Timestamp).toDate().toISOString()
          : new Date(0).toISOString(),
    }));
  }

  async setCommentStatus(id: string, status: CommentStatus): Promise<boolean> {
    const ref = this.db.collection("comments").doc(id);
    const countersRef = this.countersRef();
    return this.db.runTransaction(async (tx) => {
      const [snap, countersSnap] = await Promise.all([
        tx.get(ref),
        tx.get(countersRef),
      ]);
      if (!snap.exists) return false;
      const current = snap.get("status") as CommentStatus;
      if (current === status) return true;
      const slug = snap.get("slug") as string;
      const commentCounts =
        (countersSnap.get("comments") as Record<string, number> | undefined) ??
        {};
      const delta = status === "removed" ? -1 : 1;
      tx.update(ref, { status });
      tx.set(
        countersRef,
        {
          comments: {
            [slug]: Math.max(0, (commentCounts[slug] ?? 0) + delta),
          },
        },
        { merge: true },
      );
      return true;
    });
  }
}
