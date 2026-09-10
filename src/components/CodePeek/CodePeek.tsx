"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import ArrowIcon from "@/components/ArrowIcon";
import CheckIcon from "@/components/CheckIcon";
import CloseIcon from "@/components/CloseIcon";
import LinkIcon from "@/components/LinkIcon";
import { codePeek as copy } from "@/content/site";
import { tintLines } from "@/lib/codeTint";
import {
  dirName,
  fileKey,
  fileName,
  parseGithubBlobUrl,
  rangeLabel,
  rawContentUrl,
  refLabel,
  type CodeRef,
} from "@/lib/githubBlob";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import styles from "./CodePeek.module.css";

/**
 * Repository pane for article code references: a prose link to a GitHub blob
 * URL (`…/blob/<ref>/<path>[#L50-L53]`) opens the cited file beside the
 * article, scrolled to the cited lines, with tabs for every file the article
 * cites and the GitHub permalink. Sibling of ArticlePeek (same shell, tokens
 * and phone-sheet treatment); design and behaviour contract:
 * ../../../../claude_websie/blog-social/code-peek.js and
 * ../../../../claude_websie/design_handoff_code_peek/README.md.
 *
 * Progressive enhancement: the links stay plain links (prose.css styles them
 * as chips with no JS); a plain click opens the pane, modifier/middle clicks
 * and the context menu keep the GitHub URL.
 *
 * Desktop (≥1100px, hover-capable): a resizable side pane, a mode that stays
 * until closed; later chip clicks retarget it. Phone and touch: a bottom
 * sheet — half height with the cited excerpt, expandable to the whole file.
 */

type Ref = CodeRef & { anchor: HTMLAnchorElement };
type FileEntry = { key: string; name: string; count: number; first: number };
/** Absent from `files` while loading. */
type FileState = { status: "ready" | "error"; html: string[] };
type SheetHeight = "half" | "full";

const SELECTOR =
  '.prose:not(.prose--peek) a[href^="https://github.com/"][href*="/blob/"]';
const PANE_QUERY = "(min-width: 1100px) and (hover: hover) and (pointer: fine)";
const PANE_DEFAULT = 480;
const PANE_MIN = 380;
const ARTICLE_MIN = 520;
const PANE_STEP = 40;
const PANE_STORE = "dbln:code-pane-width";
/** Half sheet: lines of context around the cited range. */
const CONTEXT_LINES = 5;
/** Half sheet: lines shown for a whole-file reference. */
const EXCERPT_WHOLE = 14;
/** The cited range opens this many lines from the top. */
const RUNWAY_LINES = 3;
/** Grabber travel that counts as a snap. */
const SWIPE = 40;
/** Raw files above this are refused rather than rendered as thousands of rows. */
const MAX_BYTES = 1_500_000;
const COPIED_MS = 1500;

const TINT = { keyword: styles.kw, comment: styles.cm };
const fileCache = new Map<string, Promise<FileState>>();

/** Fetch + tint a file once per page; failures are not cached, so a later
    open retries. */
function loadFile(ref: CodeRef): Promise<FileState> {
  const key = fileKey(ref);
  let cached = fileCache.get(key);
  if (!cached) {
    cached = (async () => {
      try {
        const res = await fetch(rawContentUrl(ref));
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        if (text.length > MAX_BYTES) throw new Error("too large");
        const lines = text.split("\n");
        if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
        return { status: "ready" as const, html: tintLines(lines, ref.path, TINT) };
      } catch {
        fileCache.delete(key);
        return { status: "error" as const, html: [] };
      }
    })();
    fileCache.set(key, cached);
  }
  return cached;
}

function subscribePane(onChange: () => void) {
  const mq = window.matchMedia(PANE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const readPane = () => window.matchMedia(PANE_QUERY).matches;
const readPaneServer = () => true;

function clampWidth(width: number): number {
  const max = Math.max(PANE_MIN, window.innerWidth - ARTICLE_MIN);
  return Math.round(Math.min(max, Math.max(PANE_MIN, width)));
}

function dialogLabel(ref: CodeRef): string {
  if (ref.start === undefined) return ref.path;
  if (ref.end === undefined || ref.end === ref.start) {
    return copy.lineLabel.replace("{path}", ref.path).replace("{line}", String(ref.start));
  }
  return copy.rangeLabel
    .replace("{path}", ref.path)
    .replace("{start}", String(ref.start))
    .replace("{end}", String(ref.end));
}

/** Fades only where content is hidden on that side. */
function updateFade(code: HTMLElement) {
  const top = code.scrollTop > 2;
  const bottom = code.scrollTop + code.clientHeight < code.scrollHeight - 2;
  const fade = top && bottom ? "both" : top ? "top" : bottom ? "bottom" : null;
  if (fade) code.dataset.fade = fade;
  else delete code.dataset.fade;
}

export default function CodePeek() {
  const [refs, setRefs] = useState<Ref[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState<SheetHeight>("half");
  const [files, setFiles] = useState<Record<string, FileState>>({});
  const isPane = useSyncExternalStore(subscribePane, readPane, readPaneServer);
  const mode = isPane ? "pane" : "sheet";

  const closeRef = useRef<HTMLButtonElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const lastChipRef = useRef<HTMLAnchorElement | null>(null);
  const widthRef = useRef(PANE_DEFAULT);
  // Latest state for the native chip/pointer handlers, which outlive renders.
  const stateRef = useRef({ open, active, sheet });
  useEffect(() => {
    stateRef.current = { open, active, sheet };
  });

  const fileList = useMemo<FileEntry[]>(() => {
    const list: FileEntry[] = [];
    const byKey = new Map<string, FileEntry>();
    refs.forEach((ref, index) => {
      const key = fileKey(ref);
      let entry = byKey.get(key);
      if (!entry) {
        entry = { key, name: fileName(ref.path), count: 0, first: index };
        byKey.set(key, entry);
        list.push(entry);
      }
      entry.count++;
    });
    return list;
  }, [refs]);

  const activeRef = refs[active] ?? null;
  const activeKey = activeRef ? fileKey(activeRef) : null;
  const file = activeKey ? files[activeKey] : undefined;
  const full = mode === "pane" || sheet === "full";

  const openAt = useCallback((index: number, chip: HTMLAnchorElement) => {
    lastChipRef.current = chip;
    if (!stateRef.current.open) setSheet("half");
    setActive(index);
    setOpen(true);
  }, []);

  const closePane = useCallback(() => {
    setOpen(false);
    lastChipRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => {
      const n = refs.length;
      if (!n) return;
      const next = (stateRef.current.active + delta + n) % n;
      lastChipRef.current = refs[next].anchor;
      setActive(next);
    },
    [refs],
  );

  // Wire the prose links: parse, prefetch, click-to-open. Touch devices are
  // wired too (unlike ArticlePeek) — the destination is a wall of code.
  useEffect(() => {
    const wired: Ref[] = [];
    document.querySelectorAll<HTMLAnchorElement>(SELECTOR).forEach((anchor) => {
      const parsed = parseGithubBlobUrl(anchor.href);
      if (parsed) wired.push({ ...parsed, anchor });
    });
    if (!wired.length) return;
    // Portaling onto DOM that only exists after render needs this
    // measure-then-render step (same as HeadingAnchors).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRefs(wired);

    const cleanups: (() => void)[] = [];
    wired.forEach((ref, index) => {
      const onClick = (e: MouseEvent) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const { open, active } = stateRef.current;
        if (open && active === index) closePane();
        else openAt(index, ref.anchor);
      };
      const onEnter = () => void loadFile(ref);
      ref.anchor.setAttribute("aria-haspopup", "dialog");
      ref.anchor.addEventListener("click", onClick);
      ref.anchor.addEventListener("mouseenter", onEnter);
      cleanups.push(() => {
        ref.anchor.removeAttribute("aria-haspopup");
        ref.anchor.removeAttribute("aria-expanded");
        ref.anchor.removeAttribute("aria-current");
        ref.anchor.removeEventListener("click", onClick);
        ref.anchor.removeEventListener("mouseenter", onEnter);
      });
    });

    // prefetch: the first reference now, the rest as their chips near the viewport
    void loadFile(wired[0]);
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const ref = wired.find((r) => r.anchor === entry.target);
                if (ref) void loadFile(ref);
                io?.unobserve(entry.target);
              });
            },
            { rootMargin: "240px 0px" },
          )
        : null;
    wired.forEach((ref) => io?.observe(ref.anchor));

    return () => {
      io?.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [openAt, closePane]);

  // load the active file (retries a failed one on the next visit)
  useEffect(() => {
    if (!open || !activeRef || !activeKey) return;
    if (files[activeKey]?.status === "ready") return;
    void loadFile(activeRef).then((state) => {
      setFiles((prev) => ({ ...prev, [activeKey]: state }));
    });
    // `files` is read for the ready check only; a change in it must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeRef, activeKey]);

  // chip state: aria-current on the active reference, aria-expanded on
  // every reference to the file being shown
  useEffect(() => {
    refs.forEach((ref, index) => {
      const current = open && index === active;
      const expanded = open && fileKey(ref) === activeKey;
      if (current) ref.anchor.setAttribute("aria-current", "true");
      else ref.anchor.removeAttribute("aria-current");
      if (expanded) ref.anchor.setAttribute("aria-expanded", "true");
      else ref.anchor.removeAttribute("aria-expanded");
    });
  }, [refs, open, active, activeKey]);

  // desktop: the article column narrows by the pane width
  const applyWidth = useCallback((width: number, persist = false) => {
    const clamped = clampWidth(width);
    widthRef.current = clamped;
    document.documentElement.style.setProperty("--pane", `${clamped}px`);
    if (persist) {
      try {
        localStorage.setItem(PANE_STORE, String(clamped));
      } catch {
        /* storage unavailable: the width lives for this page only */
      }
    }
  }, []);

  useEffect(() => {
    if (!open || mode !== "pane") return;
    let stored = PANE_DEFAULT;
    try {
      stored = Number(localStorage.getItem(PANE_STORE)) || PANE_DEFAULT;
    } catch {
      /* see above */
    }
    applyWidth(stored);
    document.body.style.paddingRight = "var(--pane)";
    const onResize = () => applyWidth(widthRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      document.body.style.paddingRight = "";
      document.documentElement.style.removeProperty("--pane");
    };
  }, [open, mode, applyWidth]);

  // phone: the article does not scroll while the sheet is open
  useEffect(() => {
    if (!open || mode !== "sheet") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mode]);

  // focus moves to the close button on open; closePane returns it to the chip
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Esc closes — unless another dialog (the article peek) owns the key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const dialog = e.target instanceof Element ? e.target.closest('[role="dialog"]') : null;
      if (dialog && dialog !== closeRef.current?.closest('[role="dialog"]')) return;
      e.preventDefault();
      closePane();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePane]);

  const lines = useMemo(() => {
    if (!activeRef || !file || file.status !== "ready") return null;
    const total = file.html.length;
    let from = 1;
    let to = total;
    if (!full) {
      if (activeRef.start === undefined) {
        to = Math.min(total, EXCERPT_WHOLE);
      } else {
        from = Math.max(1, activeRef.start - CONTEXT_LINES);
        to = Math.min(total, (activeRef.end ?? activeRef.start) + CONTEXT_LINES);
      }
    }
    const rows = [];
    for (let n = from; n <= to; n++) {
      const cited =
        activeRef.start !== undefined &&
        n >= activeRef.start &&
        n <= (activeRef.end ?? activeRef.start);
      rows.push(
        <div
          key={n}
          className={cited ? `${styles.line} ${styles.lineHi}` : styles.line}
          data-cited={cited || undefined}
        >
          <span className={styles.gutter}>{n}</span>
          {/* our own escaped output (codeTint.ts), never the raw file */}
          <span dangerouslySetInnerHTML={{ __html: file.html[n - 1] || " " }} />
        </div>,
      );
    }
    return rows;
  }, [activeRef, file, full]);

  // the cited range sits RUNWAY_LINES from the top; the half sheet and
  // whole-file references open at their first line
  useLayoutEffect(() => {
    const code = codeRef.current;
    if (!code) return;
    const cited = code.querySelector<HTMLElement>("[data-cited]");
    code.scrollTop = cited && full ? cited.offsetTop - RUNWAY_LINES * cited.offsetHeight : 0;
    updateFade(code);
  }, [open, active, full, lines]);

  // active tab into view (scrollLeft, so the page itself never scrolls)
  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = tabs?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!tabs || !tab) return;
    const left = tab.offsetLeft - 12;
    const right = tab.offsetLeft + tab.offsetWidth + 48;
    if (left < tabs.scrollLeft) tabs.scrollLeft = left;
    else if (right > tabs.scrollLeft + tabs.clientWidth) tabs.scrollLeft = right - tabs.clientWidth;
  }, [open, activeKey, full]);

  // half sheet: scrolling past the end of the excerpt expands to the whole file
  useEffect(() => {
    const code = codeRef.current;
    if (!open || full || !code) return;
    const atEnd = () => code.scrollTop + code.clientHeight >= code.scrollHeight - 2;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && atEnd()) setSheet("full");
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      if (touchY - e.touches[0].clientY > 24 && atEnd()) {
        touchY = null;
        setSheet("full");
      }
    };
    code.addEventListener("wheel", onWheel, { passive: true });
    code.addEventListener("touchstart", onTouchStart, { passive: true });
    code.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      code.removeEventListener("wheel", onWheel);
      code.removeEventListener("touchstart", onTouchStart);
      code.removeEventListener("touchmove", onTouchMove);
    };
  }, [open, full, lines]);

  const onAsideKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === "]" || (e.altKey && e.key === "ArrowDown")) {
      e.preventDefault();
      step(1);
    } else if (e.key === "[" || (e.altKey && e.key === "ArrowUp")) {
      e.preventDefault();
      step(-1);
    }
  };

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    handle.dataset.dragging = "";
    document.body.style.cursor = "col-resize";
    const onMove = (ev: PointerEvent) => applyWidth(window.innerWidth - ev.clientX);
    const onUp = () => {
      applyWidth(widthRef.current, true);
      delete handle.dataset.dragging;
      document.body.style.cursor = "";
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  };

  const onHandleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyWidth(widthRef.current + PANE_STEP, true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      applyWidth(widthRef.current - PANE_STEP, true);
    }
  };

  // grabber: up snaps to the whole file; down returns to the half sheet,
  // and from the half sheet dismisses
  const onGrabberPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const grabber = e.currentTarget;
    grabber.setPointerCapture(e.pointerId);
    const y0 = e.clientY;
    const onUp = (ev: PointerEvent) => {
      grabber.removeEventListener("pointerup", onUp);
      grabber.removeEventListener("pointercancel", onUp);
      const dy = ev.clientY - y0;
      if (dy < -SWIPE) setSheet("full");
      else if (dy > SWIPE) {
        if (stateRef.current.sheet === "full") setSheet("half");
        else closePane();
      }
    };
    grabber.addEventListener("pointerup", onUp);
    grabber.addEventListener("pointercancel", onUp);
  };

  if (!open || !activeRef) return null;

  const range = rangeLabel(activeRef);
  const label = dialogLabel(activeRef);
  const repo = `${activeRef.owner}/${activeRef.repo}`;
  const ref = refLabel(activeRef.gitRef);
  const dir = dirName(activeRef.path);
  const name = fileName(activeRef.path);

  const head = (closeLabel: string) => (
    <header className={styles.head}>
      <span className={styles.title}>
        <span className={styles.eyebrow}>{copy.eyebrow}</span>
        <span className={styles.repo}>
          {repo} <span className={styles.repoMeta}>· {ref}</span>
        </span>
      </span>
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        onClick={closePane}
        aria-label={closeLabel}
      >
        <CloseIcon />
      </button>
    </header>
  );

  const tabs = (
    <nav ref={tabsRef} className={styles.tabs} aria-label={copy.filesLabel}>
      {fileList.map((entry) => (
        <button
          key={entry.key}
          type="button"
          className={styles.tab}
          aria-current={entry.key === activeKey ? "true" : undefined}
          onClick={() => openAt(entry.first, refs[entry.first].anchor)}
        >
          {entry.name} <span className={styles.count}>{entry.count}</span>
        </button>
      ))}
    </nav>
  );

  const path = (
    <p className={styles.path}>
      <span className={styles.pathDir}>
        {dir.split("/").filter(Boolean).join(" / ")}
        {dir ? " / " : ""}
        <span className={styles.pathFile}>{name}</span>
      </span>
      <span className={styles.range} data-ranged={range ? "" : undefined}>
        {range ?? copy.wholeFile} · {active + 1} of {refs.length}
      </span>
    </p>
  );

  const code = (
    <div
      ref={codeRef}
      className={full ? styles.code : `${styles.code} ${styles.excerpt}`}
      tabIndex={0}
      onScroll={(e) => updateFade(e.currentTarget)}
    >
      {file?.status === "error" ? (
        <p className={styles.error}>{copy.loadError}</p>
      ) : lines ? (
        lines
      ) : (
        <div className={styles.skeleton} aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      )}
    </div>
  );

  const foot = (round: boolean) => (
    <footer className={styles.foot}>
      <a
        className={styles.open}
        href={activeRef.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {copy.openOnGithub} <ArrowIcon size={13} />
      </a>
      {/* key resets the copied state whenever the pane targets a new reference */}
      <CopyPermalink key={activeRef.href} href={activeRef.href} round={round} />
    </footer>
  );

  if (mode === "pane") {
    return (
      <aside className={styles.pane} role="dialog" aria-label={label} onKeyDown={onAsideKeyDown}>
        <div
          className={styles.handle}
          role="separator"
          aria-orientation="vertical"
          aria-label={copy.resizeLabel}
          title={copy.resizeHint}
          tabIndex={0}
          onPointerDown={onHandlePointerDown}
          onDoubleClick={() => applyWidth(PANE_DEFAULT, true)}
          onKeyDown={onHandleKeyDown}
        >
          <span className={styles.grip} />
        </div>
        {head(copy.closePane)}
        {tabs}
        {path}
        {code}
        {foot(false)}
      </aside>
    );
  }

  return (
    <>
      <div className={styles.scrim} aria-hidden="true" onClick={closePane} />
      <aside
        className={styles.sheet}
        data-height={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={onAsideKeyDown}
      >
        <div className={styles.grabber} onPointerDown={onGrabberPointerDown}>
          <span aria-hidden="true" />
        </div>
        {full ? (
          <>
            {head(copy.closeSheet)}
            {tabs}
            {path}
          </>
        ) : (
          <header className={styles.head}>
            <span className={styles.title}>
              <span className={styles.file}>
                <span className={styles.dir}>{dir}</span>
                {name}
                {range ? <span className={styles.fileRange}>{range}</span> : null}
              </span>
              <span className={styles.repoLine}>
                {repo} · {ref}
              </span>
            </span>
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              onClick={closePane}
              aria-label={copy.closeSheet}
            >
              <CloseIcon />
            </button>
          </header>
        )}
        {code}
        {foot(true)}
      </aside>
    </>
  );
}

/** Copies the exact permalink of the current reference; swaps to a check +
    "copied" for a moment (round, icon-only variant on the phone sheet). */
function CopyPermalink({ href, round }: { href: string; round: boolean }) {
  const { copied, copy: copyText } = useCopyToClipboard(COPIED_MS);
  return (
    <button
      type="button"
      className={round ? `${styles.copy} ${styles.copyRound}` : styles.copy}
      data-copied={copied || undefined}
      onClick={() => copyText(href)}
      aria-label={round ? (copied ? copy.copiedLabel : copy.copyLabel) : undefined}
    >
      {copied ? <CheckIcon size={13} /> : <LinkIcon size={13} />}
      {round ? null : copied ? copy.copied : copy.copyPermalink}
    </button>
  );
}
