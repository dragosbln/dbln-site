"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { discussion as copy, site } from "@/content/site";
import { parseCommentLinks } from "@/lib/commentLinks";
import {
  firebaseSignOut,
  signInVisitor,
  type AuthProvider,
} from "@/lib/firebaseClient";
import {
  claimComments,
  clearAccount,
  CommentError,
  fetchComments,
  isMine,
  notifyCommentAdded,
  postComment,
  removeOwnComment,
  saveAccount,
  savedAccount,
  savedName,
  saveName,
  type Account,
  type PublicComment,
} from "@/lib/social";
import styles from "./Discussion.module.css";

type DiscussionProps = {
  slug: string;
};

/** Replies deeper than this hide the Reply action (mirrors the API cap). */
const REPLY_DEPTH_MAX = 4;
/** Thread fetch retries on load: retry n waits FETCH_BACKOFF_MS[n]. */
const FETCH_BACKOFF_MS = [1_000, 3_000];
/**
 * The post token can't be spent before this age (mirrors the API). The
 * button shows the wait as a progress fill (see armingClass) — Dragos kept
 * the delay but wanted the wait visible, not a dead button.
 */
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

const SITE_HOST = new URL(site.url).host;

/**
 * A comment body with its links made clickable (src/lib/commentLinks).
 * Links into this site stay in the tab; links out open a new one and are
 * marked user-generated (ugc nofollow), as any visitor can post them.
 */
function CommentBody({ text }: { text: string }) {
  return parseCommentLinks(text).map((part, i) => {
    if (part.type === "text") return part.value;
    const host = new URL(part.href).host;
    const internal = host === SITE_HOST || host === `www.${SITE_HOST}`;
    return internal ? (
      <a key={i} href={part.href}>
        {part.text}
      </a>
    ) : (
      <a
        key={i}
        href={part.href}
        target="_blank"
        rel="ugc nofollow noopener noreferrer"
      >
        {part.text}
      </a>
    );
  });
}

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
 * /api. The thread, and the post token that comes with it, is fetched as
 * soon as the page mounts (with retries), so both are there — and the API
 * instance warm — by the time a reader scrolls down. The token ripens 5s
 * after it arrives (bot guard); the Post button is disabled until then,
 * but from the first typed character it shows the wait as a progress fill
 * (determinate while a token ripens; a sliding bar while none has arrived
 * yet, which also triggers a fetch), so the wait reads as loading, not as
 * a dead button. A token the server refuses (a tab left open past its
 * expiry, a key rotation) is refreshed, ripened and the post retried once.
 * Nested replies to the API's depth cap. Reply drafts are kept per parent,
 * so a slow submit can't eat text typed into a different reply form
 * meanwhile.
 */
export default function Discussion({ slug }: DiscussionProps) {
  const [thread, setThread] = useState<PublicComment[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // When the token arrived, and whether it has ripened (TOKEN_MIN_AGE_MS).
  const [tokenAt, setTokenAt] = useState(0);
  const [tokenReady, setTokenReady] = useState(false);
  const [body, setBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [announce, setAnnounce] = useState("");
  const [now, setNow] = useState(() => Date.now());
  // Session sign-in: `account` is who we're posting as; the token getter
  // lives in a ref (re-fetched per post, never persisted). A remembered
  // account (name only) is offered on load but isn't "signed in" until a
  // fresh popup — Firebase must not load on page view (privacy).
  const [account, setAccount] = useState<Account | null>(null);
  const [remembered, setRemembered] = useState<Account | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const replyNameRef = useRef<HTMLInputElement | null>(null);
  const getTokenRef = useRef<(() => Promise<string>) | null>(null);
  // One thread fetch in flight at a time (mount, retries, on-demand).
  const fetchingRef = useRef(false);
  // Synchronous double-submit guard: the button stays enabled while a
  // post is in flight (disabling the focused button would dump keyboard
  // focus onto <body>), so the guard must not wait for a state flush.
  const submittingRef = useRef(false);
  // Anonymous-post warning: which form is pending confirmation, whether
  // the visitor already accepted guest-posting this session, and the
  // <dialog> node.
  const anonDialogRef = useRef<HTMLDialogElement | null>(null);
  const pendingParentIdRef = useRef<string | null>(null);
  const anonAcceptedRef = useRef(false);

  // The saved name is filled imperatively (no state): the server renders
  // an empty input, and hydration must match it. Read after mount to
  // avoid a hydration mismatch (localStorage is client-only).
  useEffect(() => {
    const el = nameRef.current;
    if (el && !el.value) el.value = savedName();
    // Read the remembered account only after mount: localStorage is
    // client-only, so reading it during render would mismatch the
    // server-rendered (empty) markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setRemembered(savedAccount());
  }, []);

  // A token just arrived: it ripens TOKEN_MIN_AGE_MS from now (the server
  // counts from mint time, slightly earlier, so this is the safe side).
  const armToken = useCallback((t: string) => {
    setToken(t);
    setTokenAt(Date.now());
    setTokenReady(false);
  }, []);

  // Fetch the thread on mount, retrying a couple of times: the post token
  // arrives with it, and the request warms the API instance (cold starts
  // run 2–3s) before the reader reaches the form. A failure here is not
  // fatal: typing into the form triggers another fetch (below).
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const attempt = (retry: number) => {
      fetchingRef.current = true;
      fetchComments(slug)
        .then((payload) => {
          if (cancelled) return;
          setThread(payload.comments);
          armToken(payload.token);
          setNow(Date.now());
        })
        .catch((err) => {
          console.debug("[dbln social]", err);
          const wait = FETCH_BACKOFF_MS[retry];
          if (!cancelled && wait !== undefined) {
            timer = window.setTimeout(() => attempt(retry + 1), wait);
          }
        })
        .finally(() => {
          fetchingRef.current = false;
        });
    };
    attempt(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, armToken]);

  // The token ripens TOKEN_MIN_AGE_MS after it arrives; flip the flag then,
  // so the button enables without a reload. armToken resets the flag
  // wherever a fresh token lands, so this effect only schedules the flip.
  useEffect(() => {
    if (!token || tokenReady) return;
    const remaining = Math.max(0, tokenAt + TOKEN_MIN_AGE_MS - Date.now());
    const timer = window.setTimeout(() => setTokenReady(true), remaining);
    return () => window.clearTimeout(timer);
  }, [token, tokenAt, tokenReady]);

  // Typing with no token yet (the mount fetch failed, or is still out):
  // fetch again, so the wait the visitor sees is one with an end.
  const typing =
    body.trim() !== "" ||
    Object.values(replyDrafts).some((draft) => draft.trim() !== "");
  useEffect(() => {
    if (!typing || token || fetchingRef.current) return;
    fetchingRef.current = true;
    fetchComments(slug)
      .then((payload) => {
        setThread(payload.comments);
        armToken(payload.token);
      })
      .catch((err) => console.debug("[dbln social]", err))
      .finally(() => {
        fetchingRef.current = false;
      });
  }, [typing, token, slug, armToken]);

  // Button state while the token ripens: `arming` (determinate fill, timed
  // by CSS from the moment the class lands — i.e. token arrival — so it is
  // truthful about the time left), `waiting` (no token yet, sliding bar);
  // `typing` reveals the fill. Ready → none.
  const armingClass = (text: string) =>
    tokenReady
      ? ""
      : [token ? styles.arming : styles.waiting, text.trim() ? styles.typing : ""]
          .filter(Boolean)
          .join(" ");

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

  // A token straight from the server, refreshing the thread alongside:
  // for a post whose token the server refused. It still has to ripen.
  const freshToken = async (): Promise<string> => {
    const payload = await fetchComments(slug);
    setThread(payload.comments);
    armToken(payload.token);
    return payload.token;
  };

  const announcePosted = () => {
    setAnnounce(copy.posted);
    window.setTimeout(() => setAnnounce(""), 2000);
  };

  const signIn = async (provider: AuthProvider) => {
    if (signingIn) return;
    setSigningIn(true);
    setNotice(null);
    try {
      const user = await signInVisitor(provider);
      const acct: Account = {
        uid: user.uid,
        name: user.name ?? savedName() ?? "",
      };
      getTokenRef.current = user.getIdToken;
      setAccount(acct);
      setRemembered(acct);
      saveAccount(acct);
      // Pre-fill the name if the visitor hasn't typed one.
      if (nameRef.current && !nameRef.current.value && acct.name) {
        nameRef.current.value = acct.name;
      }
      // Claim this browser's earlier anonymous comments so they're theirs
      // (and deletable). Best-effort — a failure doesn't block posting.
      try {
        const moved = await claimComments(await user.getIdToken());
        if (moved > 0) {
          // The loaded thread's `verified` flags predate the claim;
          // refresh so delete-own picks the right ownership proof.
          // Thread only: the token in hand stays valid, and re-arming it
          // would make the visitor sit through the ripening again.
          const payload = await fetchComments(slug);
          setThread(payload.comments);
        }
      } catch (err) {
        console.debug("[dbln social]", err);
      }
    } catch (err) {
      console.debug("[dbln social]", err);
      setNotice({ scope: "main", text: copy.signInFailed });
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = () => {
    getTokenRef.current = null;
    setAccount(null);
    setRemembered(null);
    clearAccount();
    // Drop Firebase's in-memory session too (fire-and-forget).
    firebaseSignOut().catch(() => {});
  };

  const deleteOwn = async (comment: PublicComment) => {
    setNotice(null);
    // The proof a comment needs is fixed at post time: a verified comment
    // is owned by an account (token required); an anonymous one by this
    // browser's device id. The flag can be stale right after a claim, so
    // a not_owner answer retries once with the other available proof.
    const withToken = async () => {
      const getToken = getTokenRef.current;
      return getToken ? removeOwnComment(comment.id, await getToken()) : null;
    };
    try {
      if (comment.verified) {
        if (!account || !getTokenRef.current) {
          setNotice({ scope: `del:${comment.id}`, text: copy.deleteNeedsSignIn });
          return;
        }
        await withToken();
      } else {
        try {
          await removeOwnComment(comment.id);
        } catch (err) {
          const notOwner =
            err instanceof CommentError && err.code === "not_owner";
          if (notOwner && account && getTokenRef.current) await withToken();
          else throw err;
        }
      }
      setThread((cur) =>
        (cur ?? []).map((c) =>
          c.id === comment.id
            ? { ...c, removed: true, name: "", body: "", verified: false }
            : c,
        ),
      );
      notifyCommentAdded(slug, Math.max(0, total - 1));
    } catch (err) {
      console.debug("[dbln social]", err);
      setNotice({ scope: `del:${comment.id}`, text: copy.deleteFailed });
    }
  };

  const handleSubmit = (e: FormEvent, parentId: string | null) => {
    e.preventDefault();
    if (!token || !tokenReady || submittingRef.current) return;
    const nameEl = parentId ? replyNameRef.current : nameRef.current;
    const name = (nameEl?.value ?? "").trim();
    const text = (parentId ? (replyDrafts[parentId] ?? "") : body).trim();
    if (!name || !text) return;
    // Anonymous poster: warn once per session that a guest comment can't
    // be managed later. Signed-in posters skip straight through.
    if (!getTokenRef.current && !anonAcceptedRef.current) {
      pendingParentIdRef.current = parentId;
      anonDialogRef.current?.showModal();
      return;
    }
    void doSubmit(parentId);
  };

  const doSubmit = async (parentId: string | null) => {
    if (!token || !tokenReady || submittingRef.current) return;
    const nameEl = parentId ? replyNameRef.current : nameRef.current;
    const name = (nameEl?.value ?? "").trim();
    const text = (parentId ? (replyDrafts[parentId] ?? "") : body).trim();
    if (!name || !text) return;

    submittingRef.current = true;
    setSubmitting(true);
    setNotice(null);
    try {
      // Key on the token getter, not `account` state: after a sign-in from
      // the warning dialog the ref is set before React flushes the state.
      const getToken = getTokenRef.current;
      const idToken = getToken ? await getToken() : undefined;
      const send = (postToken: string) =>
        postComment({ slug, parentId, name, body: text, token: postToken, idToken });
      let posted: PublicComment;
      try {
        posted = await send(token);
      } catch (err) {
        // The server refused the token (a tab left open past its expiry,
        // a key rotation): take a fresh one, let it ripen — the button
        // shows the fill meanwhile — and retry once.
        if (!(err instanceof CommentError && err.code === "token")) throw err;
        const fresh = await freshToken();
        await new Promise((r) => window.setTimeout(r, TOKEN_MIN_AGE_MS + 250));
        posted = await send(fresh);
      }
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
      console.debug("[dbln social]", err);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Warning-dialog choices. Guest: accept for the session, then post.
  // Sign in: run the popup, and if it succeeds continue the post as the
  // now-signed-in account (getTokenRef is set synchronously on success).
  const postAsGuest = () => {
    anonAcceptedRef.current = true;
    anonDialogRef.current?.close();
    void doSubmit(pendingParentIdRef.current);
  };

  const dialogSignIn = async (provider: AuthProvider) => {
    await signIn(provider);
    anonDialogRef.current?.close();
    if (getTokenRef.current) void doSubmit(pendingParentIdRef.current);
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
                {c.author ? (
                  <span className={`${styles.badge} ${styles.badgeAuthor}`}>
                    {copy.badgeAuthor}
                  </span>
                ) : c.verified ? (
                  <span className={`${styles.badge} ${styles.badgeMember}`}>
                    {copy.badgeMember}
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeGuest}`}>
                    {copy.badgeGuest}
                  </span>
                )}
                <span
                  className={styles.when}
                  title={new Date(c.at).toLocaleString("en-US")}
                >
                  {timeAgo(c.at, now)}
                </span>
              </div>
              <p className={styles.body}>
                <CommentBody text={c.body} />
              </p>
            </>
          )}
          {!c.removed && (c.depth < REPLY_DEPTH_MAX || isMine(c.id)) ? (
            <div className={styles.actions}>
              {c.depth < REPLY_DEPTH_MAX ? (
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
              ) : null}
              {isMine(c.id) ? (
                <button
                  type="button"
                  className={styles.deleteLink}
                  onClick={() => {
                    if (window.confirm(copy.deleteConfirm)) deleteOwn(c);
                  }}
                >
                  {copy.deleteLabel}
                </button>
              ) : null}
            </div>
          ) : null}
          {notice?.scope === `del:${c.id}` ? (
            <p className={styles.error} role="status">
              {notice.text}
            </p>
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
                  className={`${styles.rfBtn} ${armingClass(draft)}`}
                  disabled={!tokenReady || !draft.trim()}
                  aria-busy={!tokenReady && draft.trim() !== ""}
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
            className={`${styles.postBtn} ${armingClass(body)}`}
            disabled={!tokenReady || !body.trim()}
            aria-busy={!tokenReady && body.trim() !== ""}
          >
            {copy.postLabel}
          </button>
        </div>
        <div className={styles.identity}>
          {account ? (
            <>
              <span className={styles.postingAs}>
                {copy.postingAs.replace("{name}", () => account.name)}
              </span>
              <button
                type="button"
                className={styles.identityBtn}
                onClick={signOut}
              >
                {copy.signOut}
              </button>
            </>
          ) : (
            <>
              <span className={styles.signInPrompt}>
                {remembered
                  ? copy.signInAs.replace("{name}", () =>
                      firstName(remembered.name),
                    )
                  : copy.signInPrompt}
              </span>
              <span className={styles.providers}>
                <button
                  type="button"
                  className={styles.identityBtn}
                  disabled={signingIn}
                  onClick={() => signIn("google")}
                >
                  {copy.signInGoogle}
                </button>
                <button
                  type="button"
                  className={styles.identityBtn}
                  disabled={signingIn}
                  onClick={() => signIn("github")}
                >
                  {copy.signInGithub}
                </button>
              </span>
            </>
          )}
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
      <dialog
        ref={anonDialogRef}
        className={styles.anonDialog}
        // Click on the backdrop (the dialog element itself) dismisses it.
        onClick={(e) => {
          if (e.target === anonDialogRef.current) anonDialogRef.current.close();
        }}
      >
        <h3 className={styles.anonTitle}>{copy.anonTitle}</h3>
        <p className={styles.anonBody}>{copy.anonBody}</p>
        <div className={styles.anonButtons}>
          <button
            type="button"
            className={styles.anonGuestCta}
            onClick={postAsGuest}
          >
            {copy.anonPostAnyway}
          </button>
          <button
            type="button"
            className={styles.anonSignInBtn}
            disabled={signingIn}
            onClick={() => dialogSignIn("google")}
          >
            {copy.anonSignIn} · {copy.signInGoogle}
          </button>
          <button
            type="button"
            className={styles.anonSignInBtn}
            disabled={signingIn}
            onClick={() => dialogSignIn("github")}
          >
            {copy.anonSignIn} · {copy.signInGithub}
          </button>
          <button
            type="button"
            className={styles.anonCancel}
            onClick={() => anonDialogRef.current?.close()}
          >
            {copy.anonCancel}
          </button>
        </div>
      </dialog>
    </section>
  );
}
