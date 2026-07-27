"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import CommentIcon from "@/components/CommentIcon";
import HeartIcon from "@/components/HeartIcon";
import ShareButton from "@/components/ShareButton";
import { track } from "@/lib/analytics";
import {
  fetchCounts,
  likedLocally,
  postLike,
  setLikedLocally,
  subscribeComments,
  subscribeLiked,
} from "@/lib/social";
import styles from "./EngageBar.module.css";

type EngageBarProps = {
  slug: string;
};

/**
 * Like + Share row after the article (design: blog-social engage bar).
 * Server-rendered resting state is "not liked, no count"; the browser's
 * own liked state and the server count layer on after hydration. The
 * count is fetched only when the bar comes near the viewport, and shown
 * only when it is at least 1 — a real zero renders nothing rather than
 * reading as a dead article.
 */
export default function EngageBar({ slug }: EngageBarProps) {
  // Liked state lives in src/lib/social (localStorage + session overlay);
  // the server snapshot is always "not liked" so hydration matches the
  // prerendered resting state, then the browser's own state layers on.
  const liked = useSyncExternalStore(
    subscribeLiked,
    () => likedLocally(slug),
    () => false,
  );
  // Count model: `server` is the last count the server reported (null
  // until the lazy GET or a POST response arrives) and `pending` is the
  // net delta of presses whose POST hasn't resolved. The displayed count
  // is server + pending — so a mid-queue server response can't wipe a
  // queued press's delta, and a failed press only ever removes its own.
  const [count, setCount] = useState<{ server: number | null; pending: number }>(
    { server: null, pending: 0 },
  );
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [bump, setBump] = useState(false);
  const likeRef = useRef<HTMLButtonElement | null>(null);
  // Serializes POSTs so a quick toggle can't apply out of order; seq
  // marks the newest press so only ITS outcome may move the button.
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const seqRef = useRef(0);

  useEffect(() => {
    const el = likeRef.current;
    if (!el) return;

    let loaded = false;
    let io: IntersectionObserver | null = null;
    const cleanup = () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    const load = () => {
      if (loaded) return;
      loaded = true;
      cleanup();
      fetchCounts()
        .then((counts) => {
          // Only fills an unset like count: a POST response that landed
          // while this GET was in flight is fresher (no-store,
          // post-toggle) than this snapshot, which may be CDN-cached.
          setCount((c) =>
            c.server == null ? { ...c, server: counts.likes[slug] ?? 0 } : c,
          );
          setCommentCount((n) => n ?? counts.comments[slug] ?? 0);
        })
        .catch((err) => {
          // Counts stay absent; the buttons still work on their own.
          console.debug("[dbln social]", err);
        });
    };
    const near = () =>
      el.getBoundingClientRect().top < window.innerHeight + 600;
    // Scroll fallback: IntersectionObserver delivers nothing in throttled
    // tabs (see AGENTS.md), and the like row must not depend on it.
    const onScroll = () => {
      if (near()) load();
    };

    if (near()) {
      load();
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) load();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return cleanup;
  }, [slug]);

  const onLike = () => {
    const next = !liked;
    const delta = next ? 1 : -1;
    seqRef.current += 1;
    const seq = seqRef.current;
    setLikedLocally(slug, next);
    setCount((c) => ({ ...c, pending: c.pending + delta }));
    if (next) setBump(true);

    chainRef.current = chainRef.current.then(() =>
      postLike(slug, next ? "like" : "unlike")
        .then((res) => {
          // This press's delta is now included in the server count; any
          // presses queued behind it keep theirs in `pending`. The button
          // only follows the response of the NEWEST press, so a mid-queue
          // response can't flip it against the user's last action.
          setCount((c) => ({ server: res.likes, pending: c.pending - delta }));
          if (seqRef.current === seq) setLikedLocally(slug, res.liked);
          if (next) track("Like", { slug });
        })
        .catch((err) => {
          console.debug("[dbln social]", err);
          // Drop only this press's optimistic delta. If it was the last
          // press, also put the button back where the server has it.
          setCount((c) => ({ ...c, pending: c.pending - delta }));
          if (seqRef.current === seq) setLikedLocally(slug, !next);
        }),
    );
  };

  // A comment posted in the Discussion below updates the bar's count
  // live — with the poster's real thread total, not a blind increment,
  // so the bar can't disagree with the heading when the counts GET
  // failed or lagged.
  useEffect(
    () =>
      subscribeComments((s, total) => {
        if (s === slug) setCommentCount(total);
      }),
    [slug],
  );

  const jumpToDiscussion = () => {
    document
      .getElementById("discussion")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(
      () =>
        document.getElementById("comment-body")?.focus({ preventScroll: true }),
      450,
    );
  };

  const likes =
    count.server == null ? null : Math.max(0, count.server + count.pending);

  return (
    <>
      <button
        ref={likeRef}
        type="button"
        className={liked ? `${styles.act} ${styles.on}` : styles.act}
        onClick={onLike}
        aria-pressed={liked}
        data-bump={bump || undefined}
        onAnimationEnd={() => setBump(false)}
      >
        <HeartIcon />
        {liked ? "Liked" : "Like"}
        {likes != null && likes > 0 ? (
          <span className={styles.ct}>{likes}</span>
        ) : null}
      </button>
      <button type="button" className={styles.act} onClick={jumpToDiscussion}>
        <CommentIcon />
        Comment
        {commentCount != null && commentCount > 0 ? (
          <span className={styles.ct}>{commentCount}</span>
        ) : null}
      </button>
      <span className={styles.shareSlot}>
        <ShareButton />
      </span>
    </>
  );
}
