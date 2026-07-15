"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import type { ContactBooking } from "@/content/types";
import styles from "./BookingFlow.module.css";

const CAL_NAMESPACE = "booking";

/**
 * Paper-token theme for the embedded booker. Colors only — the booker's
 * fonts are Cal's own and cannot be themed from outside the iframe.
 */
const CAL_CSS_VARS: Record<string, string> = {
  "cal-brand": "#0c7b72",
  "cal-brand-emphasis": "#0a5b55",
  "cal-brand-text": "#ffffff",
  "cal-bg": "#f6f4ef",
  "cal-bg-emphasis": "#e4efec",
  "cal-bg-subtle": "#efece4",
  "cal-bg-muted": "#efece4",
  "cal-border": "#d9d5cb",
  "cal-border-subtle": "#d9d5cb",
  "cal-border-muted": "#e5e2d9",
  "cal-border-booker": "#f6f4ef",
  "cal-text": "#4a4d52",
  "cal-text-emphasis": "#17191c",
  "cal-text-subtle": "#6b6e73",
  "cal-text-muted": "#8a8c8f",
};

type BookingFlowProps = {
  /** Server-rendered kicker + title + lede (slotted in above the steps). */
  heading: ReactNode;
  booking: ContactBooking;
  email: string;
};

/**
 * The contact section's booking flow (direction 3a): format picker on the
 * left, a paper card with the Cal.com inline embed on the right. The picked
 * format prefills a hidden booking field on the Cal event; the booker stays
 * veiled (blurred, inert) until a format is picked, and switching the format
 * after the visitor has clicked into the booker asks for confirmation first,
 * because the switch restarts the booking.
 *
 * Embed constraints this component works around (see AGENTS.md, "Contact
 * booking"): the embed reads `config` once at iframe creation, so a format
 * change remounts `<Cal>` via `key`; and `ui` instructions (theme vars,
 * hideEventTypeDetails) are one-shot postMessages, so they are re-applied on
 * every `linkReady`.
 */
export default function BookingFlow({ heading, booking, email }: BookingFlowProps) {
  const [format, setFormat] = useState<string | null>(null);
  /** Format change awaiting restart confirmation ({ next: null } = deselect). */
  const [pending, setPending] = useState<{ next: string | null } | null>(null);
  /** Whether the visitor has clicked into the booker since its last (re)mount. */
  const [interacted, setInteracted] = useState(false);
  const [inView, setInView] = useState(false);
  const [calReady, setCalReady] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const embedRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Create the iframe only when the card approaches the viewport (600px
  // margin), so Cal's script and booker don't load with the page. IO does the
  // watching; a position check on mount and on scroll covers environments
  // where IO entries are late or absent (same reasoning as Reveal's
  // above-the-fold check).
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const margin = 600;
    const near = () =>
      el.getBoundingClientRect().top < window.innerHeight + margin;
    let io: IntersectionObserver | null = null;
    const arm = () => {
      setInView(true);
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (near()) arm();
    };
    if (near()) {
      arm();
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) arm();
      },
      { rootMargin: `${margin}px 0px` },
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Theme the booker and hide its own event meta (the card header replaces
  // it). linkReady fires after every iframe load, including remounts.
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const ui = {
      hideEventTypeDetails: true,
      layout: "month_view" as const,
      cssVarsPerTheme: { light: CAL_CSS_VARS, dark: CAL_CSS_VARS },
    };
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (cancelled) return;
      cal("ui", ui);
      cal("on", { action: "linkReady", callback: () => cal("ui", ui) });
      setCalReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  // A click inside a cross-origin iframe is invisible to us except as the
  // parent window losing focus to it — that blur is the interaction signal.
  useEffect(() => {
    const onWindowBlur = () => {
      const el = embedRef.current;
      if (el && document.activeElement && el.contains(document.activeElement)) {
        setInteracted(true);
      }
    };
    window.addEventListener("blur", onWindowBlur);
    return () => window.removeEventListener("blur", onWindowBlur);
  }, []);

  // The restart confirmation is a native <dialog>; open/close follows
  // `pending`. Cleanup runs in every owned close path (buttons, backdrop,
  // Esc) — the `close` event is only a safety net for unowned closes.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending && !dialog.open) dialog.showModal();
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  const applyFormat = (next: string | null) => {
    setFormat(next);
    // Fresh iframe after a format change; nothing has been clicked in it yet.
    setInteracted(false);
    setPending(null);
  };

  const requestFormat = (value: string) => {
    const next = format === value ? null : value;
    if (interacted) setPending({ next });
    else applyFormat(next);
  };

  const active = booking.formats.find((f) => f.value === format) ?? null;
  const veiled = !active;
  const showCal = inView && calReady;
  const calConfig: Record<string, string> = { layout: "month_view", theme: "light" };
  if (active) calConfig.format = active.value;

  return (
    <div className={styles.grid}>
      <div>
        {heading}

        <Reveal>
          <p className={styles.step} id="booking-format-label">
            {booking.formatStep}
          </p>
          <div
            className={styles.formats}
            role="group"
            aria-labelledby="booking-format-label"
          >
            {booking.formats.map((f) => (
              <button
                key={f.value}
                type="button"
                className={styles.format}
                aria-pressed={format === f.value}
                onClick={() => requestFormat(f.value)}
              >
                <span className={styles.formatNum} aria-hidden="true">
                  {f.num}
                </span>
                <span>
                  <span className={styles.formatTitle}>{f.title}</span>
                  <span className={styles.formatDesc}>{f.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal className={styles.mailRow}>
          <a className={styles.mail} href={`mailto:${email}`}>
            {email}
          </a>
          <span className={styles.mailHint}>{booking.emailHint}</span>
        </Reveal>
      </div>

      <div>
        <Reveal as="p" className={styles.step}>
          {booking.timeStep}
        </Reveal>
        <div className={styles.card} ref={cardRef}>
          <div className={styles.cardHead}>
            <div>
              <p className={styles.event}>{booking.event.title}</p>
              <p className={styles.eventMeta}>{booking.event.meta}</p>
            </div>
            {active && (
              <span className={styles.chip}>
                {booking.event.chipPrefix}
                {active.chip}
              </span>
            )}
          </div>
          <div className={styles.embed} aria-busy={!showCal}>
            <div ref={embedRef} inert={veiled}>
              {showCal ? (
                <Cal
                  key={active?.value ?? ""}
                  namespace={CAL_NAMESPACE}
                  calLink={booking.event.calLink}
                  config={calConfig}
                  className={styles.cal}
                />
              ) : (
                <div className={styles.skeleton} aria-hidden="true">
                  <div />
                  <div />
                  <div />
                </div>
              )}
            </div>
            {veiled && (
              <div className={styles.veil}>
                <p className={styles.veilPill}>{booking.veil}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="booking-restart-title"
        onCancel={(e) => {
          // Esc = keep the booking.
          e.preventDefault();
          setPending(null);
        }}
        onClick={(e) => {
          // Clicks land on the dialog element itself only via the backdrop.
          if (e.target === dialogRef.current) setPending(null);
        }}
        onClose={() => setPending(null)}
      >
        <p className={styles.dialogTitle} id="booking-restart-title">
          {booking.restart.title}
        </p>
        <p className={styles.dialogBody}>{booking.restart.body}</p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancel}
            onClick={() => setPending(null)}
          >
            {booking.restart.cancel}
          </button>
          <button
            type="button"
            className={styles.dialogConfirm}
            onClick={() => pending && applyFormat(pending.next)}
          >
            {booking.restart.confirm}
          </button>
        </div>
      </dialog>
    </div>
  );
}
