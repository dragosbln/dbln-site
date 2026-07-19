import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { LikeAction, SocialStore, ToggleResult } from "./store";

/**
 * Production store. Collections:
 * - likeEvents/{auto}: append-only record of every state-changing press
 *   ({slug, subject, action, at}). Never updated, never deleted by code.
 * - likeStates/{slug}__{subject}: the subject's current toggle state —
 *   what makes a like idempotent per browser (later: per account).
 * - meta/counters: {likes: {slug: n}} — displayed counts, written in the
 *   SAME transaction as the state + event, so counts always equal what
 *   the records add up to.
 *
 * `subject` is a random client id (`d_<uuid>`), never an IP, never a
 * name. See AGENTS.md "Social backend".
 */
export class FirestoreStore implements SocialStore {
  constructor(private db: Firestore) {}

  async toggleLike(
    slug: string,
    subject: string,
    action: LikeAction,
  ): Promise<ToggleResult> {
    const stateRef = this.db.collection("likeStates").doc(`${slug}__${subject}`);
    const countersRef = this.db.collection("meta").doc("counters");
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

  async getLikeCounts(): Promise<Record<string, number>> {
    const snap = await this.db.collection("meta").doc("counters").get();
    return (snap.get("likes") as Record<string, number> | undefined) ?? {};
  }
}
