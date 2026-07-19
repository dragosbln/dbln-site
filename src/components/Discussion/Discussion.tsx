"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { discussion as copy } from "@/content/site";
import {
  CommentError,
  fetchComments,
  notifyCommentAdded,
  postComment,
  savedName,
  saveName,
  type PublicComment,
} from "@/lib/social";
import styles from "./Discussion.module.css";

type DiscussionProps = {
  slug: string;
};

/** Replies deeper than this hide the Reply action (mirrors the API cap). */
const REPLY_DEPTH_MAX = 4;
/** The post token can't be spent before this age (mirrors the API). */
const TOKEN_MIN_AGE_MS = 5_000;

/** Where a notice belongs: the main form, or one reply form by parent id. */
type Notice = { scope: "main" | string; text: string };

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    // Code-point slice: word[0] would split surrogate pairs (emoji names).
    .map((word) => [...word][0])
    .join("")
    .toUpperCase() || "?";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function timeAgo(iso: string, now: number): string {
  const s = Math.floor((now - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + (m === 1 ? " min ago" : " mins ago");
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hr ago" : " hrs ago");
  const d = Math.floor(h / 24);
  if (d < 30) return d + (d === 1 ? " day ago" : " days ago");
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The article Discussion section (design: blog-social article page).
 * Comments post instantly — no review queue — through the same-origin
 * /api. The thread is fetched only when the section nears the viewport;
 * the server hands a post token along with it, which ripens after a few
 * seconds (bot guard). Nested replies to the API's depth cap. Reply
 * drafts are kept per parent, so a slow submit can't eat text typed
 * into a different reply form meanwhile.
 */
export default function Discussion({ slug }: DiscussionProps) {
  const [thread, setThread] = useState<PublicComment[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [body, setBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [announce, setAnnounce] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const rootRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const replyNameRef = useRef<HTMLInputElement | null>(null);
  const loadedRef = useRef(false);
  // Synchronous double-submit guard: the button stays enabled while a
  // post is in flight (disabling the focused button would dump keyboard
  // focus onto <body>), so the guard must not wait for a state flush.
  const submittingRef = useRef(false);

  // The saved name is filled imperatively (no state): the server renders
  // an empty input, and hydration must match it.
  useEffect(() => {
    const el = nameRef.current;
    if (el && !el.value) el.value = savedName();
  }, []);

  // Lazy thread fetch on approach — IO plus the scroll fallback for
  // throttled tabs (see AGENTS.md).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;
    const cleanup = () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    const load = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      cleanup();
      fetchComments(slug)
        .then((payload) => {
          setThread(payload.comments);
          setToken(payload.token);
          setTokenReady(false);
          setNow(Date.now());
        })
        .catch((err) => {
          console.debug("[dbln social]", err);
          // Leave thread null: the section renders nothing beyond the
          // form, and posting without a token is disabled.
        });
    };
    const near = () =>
      el.getBoundingClientRect().top < window.innerHeight + 600;
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

  // The token ripens TOKEN_MIN_AGE_MS after it arrives; flip the flag
  // exactly then so the post button enables without a reload. The flag
  // is reset to false wherever a fresh token lands (async contexts), so
  // this effect only ever schedules the flip.
  useEffect(() => {
    if (!token || tokenReady) return;
    const timer = window.setTimeout(() => setTokenReady(true), TOKEN_MIN_AGE_MS);
    return () => window.clearTimeout(timer);
  }, [token, tokenReady]);

  // Keep "x mins ago" labels honest while the tab stays open.
  useEffect(() => {
    if (!thread?.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [thread]);

  const children = useMemo(() => {
    const map = new Map<string, PublicComment[]>();
    for (const c of thread ?? []) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return map;
  }, [thread]);

  const roots = useMemo(
    () =>
      (thread ?? [])
        .filter((c) => !c.parentId)
        // Top level newest-first (design); replies stay oldest-first.
        .slice()
        .reverse(),
    [thread],
  );

  const total = (thread ?? []).filter((c) => !c.removed).length;

  const refreshAfterTokenFailure = () => {
    fetchComments(slug)
      .then((payload) => {
        setThread(payload.comments);
        setToken(payload.token);
        setTokenReady(false);
      })
      .catch(() => {
        // Next submit shows the generic error again.
      });
  };

  const announcePosted = () => {
    setAnnounce(copy.posted);
    window.setTimeout(() => setAnnounce(""), 2000);
  };

  const handleSubmit = async (e: FormEvent, parentId: string | null) => {
    e.preventDefault();
    if (!token || submittingRef.current) return;
    const nameEl = parentId ? replyNameRef.current : nameRef.current;
    const name = (nameEl?.value ?? "").trim();
    const text = (parentId ? (replyDrafts[parentId] ?? "") : body).trim();
    if (!name || !text) return;

    submittingRef.current = true;
    setSubmitting(true);
    setNotice(null);
    try {
      const posted = await postComment({ slug, parentId, name, body: text, token });
      setThread((cur) => [...(cur ?? []), posted]);
      saveName(name);
      notifyCommentAdded(slug, total + 1);
      setNow(Date.now());
      announcePosted();
      if (parentId) {
        setReplyDrafts((drafts) => {
          const next = { ...drafts };
          delete next[parentId];
          return next;
        });
        // Close only if this parent's form is still the open one — the
        // user may have opened another reply meanwhile.
        setOpenReplyId((cur) => (cur === parentId ? null : cur));
        // The reply form unmounts: hand focus to the new comment.
        requestAnimationFrame(() =>
          document.getElementById(`comment-${posted.id}`)?.focus(),
        );
      } else {
        setBody("");
      }
    } catch (err) {
      const code = err instanceof CommentError ? err.code : "";
      setNotice({
        scope: parentId ?? "main",
        text: code === "rate_limited" ? copy.errorRate : copy.errorGeneric,
      });
      if (code === "token") refreshAfterTokenFailure();
      console.debug("[dbln social]", err);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const openReply = (id: string) => {
    setOpenReplyId((cur) => (cur === id ? null : id));
  };

  // Focus the reply textarea when a reply form opens.
  const replyBodyRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (openReplyId) replyBodyRef.current?.focus();
    const el = replyNameRef.current;
    if (openReplyId && el && !el.value) el.value = savedName();
  }, [openReplyId]);

  const renderComment = (c: PublicComment): ReactNode => {
    const kids = children.get(c.id) ?? [];
    const draft = replyDrafts[c.id] ?? "";
    return (
      <div
        className={styles.comment}
        key={c.id}
        id={`comment-${c.id}`}
        tabIndex={-1}
      >
        <div className={styles.avatar} aria-hidden="true">
          {c.removed ? "–" : initials(c.name)}
        </div>
        <div>
          {c.removed ? (
            <p className={styles.removedNote}>{copy.removedLabel}</p>
          ) : (
            <>
              <div className={styles.top}>
                <span className={styles.who}>{c.name}</span>
                <span
                  className={styles.when}
                  title={new Date(c.at).toLocaleString("en-US")}
                >
                  {timeAgo(c.at, now)}
                </span>
              </div>
              <p className={styles.body}>{c.body}</p>
            </>
          )}
          {!c.removed && c.depth < REPLY_DEPTH_MAX ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.replyLink}
                onClick={() => openReply(c.id)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M9 17l-5-5 5-5M4 12h11a5 5 0 0 1 5 5v1" />
                </svg>
                {copy.replyLabel}
              </button>
            </div>
          ) : null}
          {openReplyId === c.id ? (
            <form
              className={styles.replyForm}
              onSubmit={(e) => handleSubmit(e, c.id)}
              aria-busy={submitting}
            >
              <textarea
                ref={replyBodyRef}
                value={draft}
                maxLength={1200}
                onChange={(e) =>
                  setReplyDrafts((drafts) => ({
                    ...drafts,
                    [c.id]: e.target.value,
                  }))
                }
                // Function replacement: a name like "$&" must not trigger
                // String.replace's substitution patterns.
                placeholder={copy.replyPlaceholder.replace("{name}", () =>
                  firstName(c.name),
                )}
                aria-label={copy.replyPlaceholder.replace("{name}", () =>
                  firstName(c.name),
                )}
                required
              />
              <div className={styles.rfFoot}>
                <input
                  ref={replyNameRef}
                  type="text"
                  maxLength={60}
                  placeholder={copy.namePlaceholder}
                  aria-label={copy.namePlaceholder}
                  required
                />
                <button
                  type="submit"
                  className={styles.rfBtn}
                  disabled={!tokenReady || !draft.trim()}
                >
                  {copy.replyLabel}
                </button>
                <button
                  type="button"
                  className={styles.rfCancel}
                  onClick={() => setOpenReplyId(null)}
                >
                  {copy.cancelLabel}
                </button>
              </div>
              <p className={styles.error} role="status">
                {notice?.scope === c.id ? notice.text : ""}
              </p>
            </form>
          ) : null}
          {kids.length > 0 ? (
            <div className={styles.replies}>{kids.map(renderComment)}</div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <section
      id="discussion"
      ref={rootRef}
      className={styles.comments}
      aria-labelledby="discussion-title"
    >
      <h2 className={styles.head} id="discussion-title">
        {copy.heading}
        {total > 0 ? <b> ({total})</b> : null}
      </h2>
      <p className={styles.srOnly} role="status">
        {announce}
      </p>
      <form
        className={styles.form}
        onSubmit={(e) => handleSubmit(e, null)}
        autoComplete="off"
        aria-busy={submitting}
      >
        <div className={styles.row}>
          <input
            ref={nameRef}
            type="text"
            maxLength={60}
            placeholder={copy.namePlaceholder}
            aria-label={copy.namePlaceholder}
            required
          />
        </div>
        <div className={styles.row}>
          <textarea
            id="comment-body"
            value={body}
            maxLength={1200}
            onChange={(e) => setBody(e.target.value)}
            placeholder={copy.bodyPlaceholder}
            aria-label={copy.bodyPlaceholder}
            required
          />
        </div>
        <div className={styles.foot}>
          <span className={styles.hint}>{copy.hint}</span>
          <button
            type="submit"
            className={styles.postBtn}
            disabled={!tokenReady || !body.trim()}
          >
            {copy.postLabel}
          </button>
        </div>
        <p className={styles.error} role="status">
          {notice?.scope === "main" ? notice.text : ""}
        </p>
      </form>
      {thread != null ? (
        roots.length === 0 ? (
          <p className={styles.empty}>{copy.empty}</p>
        ) : (
          <div className={styles.list}>{roots.map(renderComment)}</div>
        )
      ) : null}
    </section>
  );
}
