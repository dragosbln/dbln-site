"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { signInWithGoogle, signOutAdmin } from "@/lib/firebaseClient";
import styles from "./AdminPanel.module.css";

/**
 * The /admin moderation panel — Dragos's tool, not a public surface (the
 * page is noindexed, unlinked and absent from the sitemap; the API admits
 * only allowlisted uids). Everything renders client-side after a Google
 * sign-in; the static export contains nothing but the sign-in card.
 */

type AdminComment = {
  id: string;
  slug: string;
  parentId: string | null;
  name: string;
  body: string;
  subject: string;
  status: "visible" | "removed";
  depth: number;
  at: string;
};

type LikeEvent = {
  slug: string;
  subject: string;
  action: "like" | "unlike";
  at: string;
};

type Overview = {
  counts: {
    likes: Record<string, number>;
    comments: Record<string, number>;
  };
  comments: AdminComment[];
  likeEvents: LikeEvent[];
  hasMore?: { comments: boolean; likeEvents: boolean };
};

type Tab = "comments" | "likes";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Localhost-only dev path: the harness's stub verifier accepts the token
 * from localStorage "dbln:admin-dev-token" (set it to "dev-admin"), so
 * the panel is testable without Firebase Auth. Hostname-gated; inert in
 * production.
 */
function devToken(): string | null {
  if (typeof window === "undefined") return null;
  const local =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!local) return null;
  try {
    return window.localStorage.getItem("dbln:admin-dev-token");
  } catch {
    return null;
  }
}

export default function AdminPanel() {
  const [uid, setUid] = useState<string | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>("comments");
  const [slugFilter, setSlugFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const tokenRef = useRef<(() => Promise<string>) | null>(null);
  // Guards the load()/act() race: a mutation bumps this, and a load()
  // started before the mutation ignores its own (now stale) response.
  const dataGenRef = useRef(0);

  const load = useCallback(async (who: string) => {
    const getToken = tokenRef.current;
    if (!getToken) return;
    const gen = dataGenRef.current;
    setNotice(null);
    try {
      const res = await fetch("/api/admin/overview", {
        headers: { authorization: `Bearer ${await getToken()}` },
      });
      if (res.status === 401) {
        // The bootstrap path: the uid shown here is what goes into the
        // ADMIN_UIDS secret.
        setNotice(`Signed in as ${who}, but this uid is not on the ADMIN_UIDS allowlist.`);
        return;
      }
      if (!res.ok) throw new Error(`overview ${res.status}`);
      const fresh = (await res.json()) as Overview;
      // A mutation committed while this GET was in flight → its snapshot
      // is stale; drop it rather than clobber the applied change.
      if (dataGenRef.current !== gen) return;
      setData(fresh);
    } catch (err) {
      console.debug("[dbln admin]", err);
      setNotice("Couldn't load the overview. Is the API deployed?");
    }
  }, []);

  const signIn = async () => {
    setNotice(null);
    try {
      const dev = devToken();
      if (dev) {
        tokenRef.current = async () => dev;
        setUid("dev");
        await load("dev");
        return;
      }
      const user = await signInWithGoogle();
      tokenRef.current = user.getIdToken;
      setUid(user.uid);
      await load(user.uid);
    } catch (err) {
      console.debug("[dbln admin]", err);
      setNotice("Sign-in didn't complete.");
    }
  };

  const signOut = async () => {
    await signOutAdmin().catch(() => {});
    tokenRef.current = null;
    setUid(null);
    setData(null);
    setNotice(null);
  };

  const setBusyFor = (id: string, on: boolean) =>
    setBusy((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const act = async (
    action: "remove" | "restore" | "purge",
    comment: AdminComment,
  ) => {
    const getToken = tokenRef.current;
    if (!getToken || busy.has(comment.id)) return;
    if (
      action === "purge" &&
      !window.confirm(
        "Delete this comment and any replies permanently? There is no undo.",
      )
    ) {
      return;
    }
    setBusyFor(comment.id, true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/comments/${action}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${await getToken()}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id: comment.id }),
      });
      if (!res.ok) throw new Error(`${action} ${res.status}`);
      // A local mutation landed: invalidate any load() that was mid-flight.
      dataGenRef.current += 1;
      setData((cur) => {
        if (!cur) return cur;
        const purgeIds =
          action === "purge"
            ? subtreeIds(comment.id, cur.comments)
            : new Set<string>();
        const visibleDelta =
          action === "remove" && comment.status === "visible"
            ? -1
            : action === "restore" && comment.status === "removed"
              ? 1
              : action === "purge"
                ? -cur.comments.filter(
                    (c) => purgeIds.has(c.id) && c.status === "visible",
                  ).length
                : 0;
        return {
          ...cur,
          comments:
            action === "purge"
              ? cur.comments.filter((c) => !purgeIds.has(c.id))
              : cur.comments.map((c) =>
                  c.id === comment.id
                    ? { ...c, status: action === "remove" ? "removed" : "visible" }
                    : c,
                ),
          counts: {
            ...cur.counts,
            comments: {
              ...cur.counts.comments,
              [comment.slug]: Math.max(
                0,
                (cur.counts.comments[comment.slug] ?? 0) + visibleDelta,
              ),
            },
          },
        };
      });
    } catch (err) {
      console.debug("[dbln admin]", err);
      setNotice("That action failed. Reload and try again.");
    } finally {
      setBusyFor(comment.id, false);
    }
  };

  const slugs = useMemo(
    () => [...new Set(data?.comments.map((c) => c.slug) ?? [])].sort(),
    [data],
  );

  const shown = useMemo(
    () =>
      (data?.comments ?? []).filter(
        (c) =>
          (!slugFilter || c.slug === slugFilter) &&
          (statusFilter === "all" || c.status === statusFilter),
      ),
    [data, slugFilter, statusFilter],
  );

  if (!uid || !data) {
    return (
      <div className={styles.gate}>
        <p className={styles.gateLabel}>Admin</p>
        <p className={styles.gateNote}>
          Moderation panel for dbln.me. Owner sign-in only.
        </p>
        <button type="button" className={styles.signIn} onClick={signIn}>
          Sign in with Google
        </button>
        {notice ? (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        ) : null}
      </div>
    );
  }

  const anyBusy = busy.size > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.bar}>
        <div className={styles.tabs}>
          {(["comments", "likes"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              className={tab === t ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => setTab(t)}
            >
              {t === "comments"
                ? `Comments (${data.comments.length}${data.hasMore?.comments ? "+" : ""})`
                : `Likes (${data.likeEvents.length}${data.hasMore?.likeEvents ? "+" : ""})`}
            </button>
          ))}
        </div>
        <div className={styles.barRight}>
          <button
            type="button"
            className={styles.refresh}
            disabled={anyBusy}
            onClick={() => load(uid)}
          >
            Refresh
          </button>
          <button type="button" className={styles.refresh} onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}

      {tab === "comments" ? (
        <>
          <div className={styles.filters}>
            <select
              value={slugFilter}
              onChange={(e) => setSlugFilter(e.target.value)}
              aria-label="Filter by article"
            >
              <option value="">All articles</option>
              {slugs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="visible">Visible</option>
              <option value="removed">Removed</option>
            </select>
          </div>
          {data.hasMore?.comments ? (
            <p className={styles.truncated}>
              Showing the newest {data.comments.length}. Filter by article to
              reach older comments.
            </p>
          ) : null}
          {shown.length === 0 ? (
            <p className={styles.empty}>No comments match.</p>
          ) : (
            <ul className={styles.list}>
              {shown.map((c) => (
                <li
                  key={c.id}
                  className={
                    c.status === "removed"
                      ? `${styles.rowItem} ${styles.rowRemoved}`
                      : styles.rowItem
                  }
                >
                  <div className={styles.rowMeta}>
                    <span title={c.at}>{fmt(c.at)}</span>
                    <span className={styles.slug}>{c.slug}</span>
                    {c.depth > 0 ? <span>↳ reply</span> : null}
                    <span className={styles.subject} title={c.subject}>
                      {c.subject.slice(0, 12)}…
                    </span>
                    {c.status === "removed" ? (
                      <span className={styles.badge}>removed</span>
                    ) : null}
                  </div>
                  <p className={styles.rowWho}>{c.name}</p>
                  <p className={styles.rowBody}>{c.body}</p>
                  <div className={styles.rowActions}>
                    {c.status === "visible" ? (
                      <button
                        type="button"
                        disabled={busy.has(c.id)}
                        onClick={() => act("remove", c)}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy.has(c.id)}
                        onClick={() => act("restore", c)}
                      >
                        Restore
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.danger}
                      disabled={busy.has(c.id)}
                      onClick={() => act("purge", c)}
                    >
                      Delete forever
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className={styles.totals}>
            {Object.entries(data.counts.likes)
              .sort((a, b) => b[1] - a[1])
              .map(([slug, n]) => (
                <p key={slug}>
                  <span className={styles.slug}>{slug}</span> {n}{" "}
                  {n === 1 ? "like" : "likes"} ·{" "}
                  {data.counts.comments[slug] ?? 0} comments
                </p>
              ))}
            {Object.keys(data.counts.likes).length === 0 ? (
              <p className={styles.empty}>No likes yet.</p>
            ) : null}
          </div>
          {data.hasMore?.likeEvents ? (
            <p className={styles.truncated}>
              Showing the newest {data.likeEvents.length} events.
            </p>
          ) : null}
          <ul className={styles.list}>
            {data.likeEvents.map((e, i) => (
              <li key={`${e.at}-${e.subject}-${i}`} className={styles.rowItem}>
                <div className={styles.rowMeta}>
                  <span title={e.at}>{fmt(e.at)}</span>
                  <span
                    className={
                      e.action === "like" ? styles.badgeTeal : styles.badge
                    }
                  >
                    {e.action}
                  </span>
                  <span className={styles.slug}>{e.slug}</span>
                  <span className={styles.subject} title={e.subject}>
                    {e.subject.slice(0, 12)}…
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** The id + every descendant, from the loaded comment list (client mirror
 *  of the server's collectSubtree — keeps the optimistic purge correct). */
function subtreeIds(rootId: string, rows: AdminComment[]): Set<string> {
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
