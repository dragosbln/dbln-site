"use client";

import { useEffect, useRef, useState } from "react";
import ArrowIcon from "@/components/ArrowIcon";
import CheckIcon from "@/components/CheckIcon";
import CloseIcon from "@/components/CloseIcon";
import LinkIcon from "@/components/LinkIcon";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import { suffixSvgIds } from "@/lib/svgIds";
import styles from "./ArticlePeek.module.css";

/**
 * Cross-reference peek for internal article links. Progressive enhancement:
 * links in the prose stay plain <a href="/blog/…"> and clicking them
 * navigates normally. In hover-capable contexts, resting the pointer on a
 * link (or focusing it) opens a popover with the referenced part of the
 * target article — the anchored section, or the intro when there is no
 * fragment — plus an "open ↗" action to the full article in a new tab.
 * The pointer can move into the panel (grace delay); leaving both closes it.
 * On touch devices nothing is wired: links simply navigate.
 */

type Peek = {
  /** Full href for the "read the full article" CTA (pathname + fragment). */
  href: string;
  title: string;
  html: string;
  /** The article continues past the excerpt — show the ellipsis. */
  truncated: boolean;
  status: "loading" | "ready" | "error";
};

type Position = { top: number; left: number } | null;

const INTERNAL_ARTICLE = /^\/blog\/[a-z0-9-]+$/;
const OPEN_DELAY = 400;
const CLOSE_DELAY = 300;
const docCache = new Map<string, Promise<Document | null>>();

export default function ArticlePeek() {
  const panelRef = useRef<HTMLElement>(null);
  const anchorRectRef = useRef<DOMRect | null>(null);
  const anchorLinkRef = useRef<HTMLAnchorElement | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  // Generation counter: bumped on every open intent and on close, so a slow
  // fetch from an earlier hover can neither overwrite a newer peek nor
  // resurrect a dismissed one.
  const genRef = useRef(0);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [position, setPosition] = useState<Position>(null);

  const clearTimers = () => {
    if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  };

  const closePeek = () => {
    genRef.current++;
    clearTimers();
    anchorLinkRef.current?.removeAttribute("aria-expanded");
    anchorLinkRef.current = null;
    setPeek(null);
    setPosition(null);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(closePeek, CLOSE_DELAY);
  };

  const cancelClose = () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  // wire the prose links (hover-capable contexts only — touch just navigates)
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const wired: { link: HTMLAnchorElement; enter: () => void; leave: (e: Event) => void }[] = [];

    document
      .querySelectorAll<HTMLAnchorElement>('.prose a[href^="/blog/"]')
      .forEach((link) => {
        const url = new URL(link.href, window.location.origin);
        if (!INTERNAL_ARTICLE.test(url.pathname)) return;
        if (url.pathname === window.location.pathname) return;

        const enter = () => {
          cancelClose();
          if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
          void getArticleDoc(url.pathname); // prefetch during the intent delay
          openTimerRef.current = window.setTimeout(() => {
            anchorRectRef.current = link.getBoundingClientRect();
            anchorLinkRef.current?.removeAttribute("aria-expanded");
            anchorLinkRef.current = link;
            link.setAttribute("aria-expanded", "true");
            setPosition(null); // re-measure for this anchor
            const gen = ++genRef.current;
            openPeek(url.pathname, url.hash.slice(1), (p) => {
              if (gen === genRef.current) setPeek(p);
            });
          }, OPEN_DELAY);
        };
        const leave = (e: Event) => {
          if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
          openTimerRef.current = null;
          // Keyboard parity with the pointer grace: blur into the panel
          // (Tab from the trigger) must not start the close timer.
          const to = (e as FocusEvent).relatedTarget;
          if (to instanceof Node && panelRef.current?.contains(to)) return;
          scheduleClose();
        };

        link.setAttribute("aria-haspopup", "dialog");
        link.addEventListener("mouseenter", enter);
        link.addEventListener("mouseleave", leave);
        link.addEventListener("focus", enter);
        link.addEventListener("blur", leave);
        wired.push({ link, enter, leave });
      });

    return () => {
      clearTimers();
      wired.forEach(({ link, enter, leave }) => {
        link.removeAttribute("aria-haspopup");
        link.removeAttribute("aria-expanded");
        link.removeEventListener("mouseenter", enter);
        link.removeEventListener("mouseleave", leave);
        link.removeEventListener("focus", enter);
        link.removeEventListener("blur", leave);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // dismiss: Esc, click outside, window scroll/resize (the anchor moves away).
  // Pointer grace on the panel uses native listeners rather than React's
  // onMouseEnter/onMouseLeave, which are synthesized from mouseover/mouseout.
  // Focus mirrors the pointer grace (focusin/focusout) so keyboard users can
  // Tab from the trigger into the panel and operate its controls.
  useEffect(() => {
    if (!peek) return;
    const panel = panelRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Esc with focus inside the panel returns focus to the trigger link.
        if (panel?.contains(document.activeElement)) {
          anchorLinkRef.current?.focus();
        }
        closePeek();
      }
      // Tab from the open trigger moves focus into the panel instead of
      // blurring past it — the panel sits after the prose in DOM order and
      // would otherwise close before focus could ever reach its controls.
      if (
        e.key === "Tab" &&
        !e.shiftKey &&
        panel &&
        document.activeElement === anchorLinkRef.current
      ) {
        const first = panel.querySelector<HTMLElement>("button, a");
        if (first) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (panel && !panel.contains(e.target as Node)) closePeek();
    };
    const onScroll = () => closePeek();
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget;
      if (to instanceof Node && panel?.contains(to)) return;
      // Focus returning to the trigger keeps the peek open (Shift+Tab back).
      if (to === anchorLinkRef.current) return;
      scheduleClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    panel?.addEventListener("mouseenter", cancelClose);
    panel?.addEventListener("mouseleave", scheduleClose);
    panel?.addEventListener("focusin", cancelClose);
    panel?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      panel?.removeEventListener("mouseenter", cancelClose);
      panel?.removeEventListener("mouseleave", scheduleClose);
      panel?.removeEventListener("focusin", cancelClose);
      panel?.removeEventListener("focusout", onFocusOut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peek]);

  // position near the anchor (desktop) — CSS renders a bottom sheet ≤640px
  useEffect(() => {
    const panel = panelRef.current;
    const rect = anchorRectRef.current;
    if (!peek || !panel || !rect) return;
    if (window.matchMedia("(max-width: 640px)").matches) return;

    const gap = 10;
    const margin = 12;
    const { width: w, height: h } = panel.getBoundingClientRect();
    const above = rect.top >= h + gap + margin || rect.top > window.innerHeight - rect.bottom;
    const top = above
      ? Math.max(margin, rect.top - h - gap)
      : Math.min(window.innerHeight - h - margin, rect.bottom + gap);
    const left = Math.min(
      Math.max(margin, rect.left + rect.width / 2 - w / 2),
      window.innerWidth - w - margin,
    );
    setPosition({ top, left });
  }, [peek]);

  if (!peek) return null;

  return (
    <aside
      ref={panelRef}
      className={position ? `${styles.panel} ${styles.positioned}` : styles.panel}
      style={position ?? undefined}
      role="dialog"
      aria-label={peek.title || "Article preview"}
    >
      <header className={styles.head}>
        <span className={styles.title}>{peek.title || "…"}</span>
        {/* key resets the copied state each time the peek targets a new link */}
        <CopyLinkButton key={peek.href} href={peek.href} />
        <button
          type="button"
          className={styles.close}
          onClick={closePeek}
          aria-label="Close preview"
        >
          <CloseIcon />
        </button>
      </header>
      <div className={styles.body}>
        {peek.status === "loading" ? (
          <p className={styles.note}>loading…</p>
        ) : peek.status === "error" ? (
          <p className={styles.note}>preview unavailable</p>
        ) : (
          <>
            <div
              className="prose prose--peek"
              dangerouslySetInnerHTML={{ __html: peek.html }}
            />
            {peek.truncated ? (
              <p className={styles.ellipsis} aria-hidden="true">
                …
              </p>
            ) : null}
          </>
        )}
      </div>
      <footer className={styles.foot}>
        <a
          className={styles.readMore}
          href={peek.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the full article <ArrowIcon size={13} />
        </a>
      </footer>
    </aside>
  );
}

/** Copy the deep link to the peeked section (reuses the heading-copy hook). */
function CopyLinkButton({ href }: { href: string }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      className={styles.copy}
      data-copied={copied || undefined}
      onClick={() => copy(location.origin + href)}
      aria-label={
        copied
          ? "Link copied"
          : href.includes("#")
            ? "Copy link to this section"
            : "Copy link to this article"
      }
    >
      {copied ? <CheckIcon size={13} /> : <LinkIcon size={13} />}
    </button>
  );
}

async function openPeek(
  pathname: string,
  fragment: string,
  setPeek: (p: Peek) => void,
) {
  const href = fragment ? `${pathname}#${fragment}` : pathname;
  const base = { href, title: "", html: "", truncated: false } as const;
  setPeek({ ...base, status: "loading" });

  const doc = await getArticleDoc(pathname);
  if (!doc) {
    setPeek({ ...base, status: "error" });
    return;
  }
  const title = doc.querySelector("h1")?.textContent?.trim() ?? "";
  const excerpt = extractFragment(doc, fragment);
  if (!excerpt) {
    setPeek({ ...base, title, status: "error" });
    return;
  }
  setPeek({ href, title, ...excerpt, status: "ready" });
}

/** Fetch + parse an article page, cached per pathname. The `.html` retry
    covers static preview servers that don't implement clean URLs. */
function getArticleDoc(pathname: string): Promise<Document | null> {
  let cached = docCache.get(pathname);
  if (!cached) {
    cached = (async () => {
      const tryFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const doc = new DOMParser().parseFromString(await res.text(), "text/html");
          return doc.querySelector(".prose") ? doc : null;
        } catch {
          return null;
        }
      };
      return (await tryFetch(pathname)) ?? (await tryFetch(`${pathname}.html`));
    })().then((doc) => {
      // Cache successes only: a transient fetch failure must not pin
      // "preview unavailable" on this article for the rest of the session.
      if (!doc) docCache.delete(pathname);
      return doc;
    });
    docCache.set(pathname, cached);
  }
  return cached;
}

/**
 * The referenced part as HTML: for a fragment, the anchored heading plus its
 * section (until the next heading of the same or higher level); otherwise the
 * article intro (everything before the second h2). Block count is capped —
 * the peek is a preview, the footer CTA is the full text.
 * `truncated` is true when the article continues past the last block shown,
 * whether we stopped at a heading or hit the cap.
 */
function extractFragment(
  doc: Document,
  fragment: string,
): { html: string; truncated: boolean } | null {
  const prose = doc.querySelector(".prose");
  if (!prose) return null;

  const blocks: Element[] = [];
  const MAX_BLOCKS = 16;

  if (fragment) {
    const target = doc.getElementById(fragment);
    if (!target || !prose.contains(target)) return null;
    // hoist to the block level directly under .prose
    let block: Element | null = target;
    while (block && block.parentElement !== prose) block = block.parentElement;
    const level = /^H[2-4]$/.test(target.tagName) ? Number(target.tagName[1]) : 4;
    for (let el: Element | null = block; el && blocks.length < MAX_BLOCKS; el = el.nextElementSibling) {
      if (el !== block && /^H[2-4]$/.test(el.tagName) && Number(el.tagName[1]) <= level) break;
      blocks.push(el);
    }
  } else {
    let h2Count = 0;
    for (let el = prose.firstElementChild; el && blocks.length < MAX_BLOCKS; el = el.nextElementSibling) {
      if (el.tagName === "H2" && ++h2Count === 2) break;
      blocks.push(el);
    }
  }
  if (!blocks.length) return null;

  const truncated = blocks[blocks.length - 1].nextElementSibling !== null;
  const container = document.createElement("div");
  for (const block of blocks) container.appendChild(cleanBlock(block));
  return { html: container.innerHTML, truncated };
}

/** Clone a block for the peek: no duplicate ids with the host page, no dead
    diagram controls, and links open in a new tab (no nested peeks). */
function cleanBlock(block: Element): Element {
  const clone = block.cloneNode(true) as Element;
  clone.querySelectorAll(".dg-expand").forEach((btn) => btn.remove());
  clone.querySelectorAll("svg").forEach((svg) => suffixSvgIds(svg, "-pk"));
  const stripOwnId = (el: Element) => {
    if (!el.closest("svg")) el.removeAttribute("id");
  };
  stripOwnId(clone);
  clone.querySelectorAll("[id]").forEach(stripOwnId);
  clone.querySelectorAll("a").forEach((a) => {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
  return clone;
}
