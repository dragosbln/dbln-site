"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
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
  /** Server-rendered heading for the post-booking state (design 5a). */
  confirmedHeading: ReactNode;
  booking: ContactBooking;
  email: string;
  /** Host name for the scheduled card's Who row (site.name). */
  hostName: string;
};

/** Everything the confirmed state can render, merged from Cal's events. */
type ConfirmedBooking = {
  /** Booked format's option value, from Cal's record or the local pick. */
  format: string | null;
  /** The visitor's "What are you weighing?" answer. */
  weighing: string | null;
  /** Needed for the When row and the reschedule/cancel links. */
  uid: string | null;
  start: string | null;
  end: string | null;
  /** Attendee name, for the Who row. */
  attendee: string | null;
};

/**
 * Session-scoped copy of the picked format: the confirmed echo must survive
 * client-side navigation (each page mounts a fresh BookingFlow) and payload
 * gaps. Read only as an echo fallback — never to preselect the picker.
 */
const FORMAT_STORE_KEY = "dbln:booking-format";

function storeFormat(value: string | null) {
  try {
    if (value) window.sessionStorage.setItem(FORMAT_STORE_KEY, value);
    else window.sessionStorage.removeItem(FORMAT_STORE_KEY);
  } catch {
    // Storage unavailable (private mode etc.); the echo falls back to state.
  }
}

function storedFormat(): string | null {
  try {
    return window.sessionStorage.getItem(FORMAT_STORE_KEY);
  } catch {
    return null;
  }
}

/**
 * Cal response values arrive in several shapes across versions: plain
 * strings, `{ value, label }` (selects), `{ firstName, lastName }` (name).
 */
function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.value === "string" && o.value.trim()) return o.value.trim();
    const name = [o.firstName, o.lastName]
      .filter((p): p is string => typeof p === "string" && p.trim() !== "")
      .join(" ")
      .trim();
    if (name) return name;
    if (typeof o.label === "string" && o.label.trim()) return o.label.trim();
  }
  return null;
}

/**
 * Pull what the confirmed card needs out of the deprecated v1
 * `bookingSuccessful` event's booking object (`bookingSuccessfulV2` strips
 * responses). Every field is best-effort with the fallbacks Cal has used:
 * notes can live in `responses.notes` or `description`; the attendee in
 * `responses.name` or `attendees[0].name`; times in `startTime`/`endTime`.
 */
function extractBooking(bookingData: unknown): {
  format: string | null;
  weighing: string | null;
  attendee: string | null;
  uid: string | null;
  start: string | null;
  end: string | null;
} {
  const out: ReturnType<typeof extractBooking> = {
    format: null,
    weighing: null,
    attendee: null,
    uid: null,
    start: null,
    end: null,
  };
  if (typeof bookingData !== "object" || bookingData === null) return out;
  const b = bookingData as Record<string, unknown>;
  const responses = (
    typeof b.responses === "object" && b.responses !== null ? b.responses : {}
  ) as Record<string, unknown>;
  out.format = asString(responses.format);
  out.weighing = asString(responses.notes) ?? asString(b.description);
  out.attendee = asString(responses.name);
  if (!out.attendee && Array.isArray(b.attendees) && b.attendees.length > 0) {
    const first = b.attendees[0];
    if (typeof first === "object" && first !== null) {
      out.attendee = asString((first as { name?: unknown }).name);
    }
  }
  out.uid = asString(b.uid);
  out.start = asString(b.startTime);
  out.end = asString(b.endTime);
  return out;
}

/** "Thursday, July 16 2026" + "11:30 – 12:00" + the visitor's timezone. */
function formatWhen(
  startIso: string | null,
  endIso: string | null,
): { date: string; range: string; tz: string } | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const day = (d: Date) =>
    `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${d.toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric" },
    )} ${d.getFullYear()}`;
  const time = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return {
    date: day(start),
    range: `${time(start)} – ${time(end)}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  };
}

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
export default function BookingFlow({
  heading,
  confirmedHeading,
  booking,
  email,
  hostName,
}: BookingFlowProps) {
  const [format, setFormat] = useState<string | null>(null);
  /** Format change awaiting restart confirmation ({ next: null } = deselect). */
  const [pending, setPending] = useState<{ next: string | null } | null>(null);
  /** Whether the visitor has clicked into the booker since its last (re)mount. */
  const [interacted, setInteracted] = useState(false);
  /** Set once Cal reports a completed booking; per-session only (design 5a). */
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [inView, setInView] = useState(false);
  const [calReady, setCalReady] = useState(false);
  /** Mirror of `format` for the event handlers (registered once, no stale closure). */
  const formatRef = useRef<string | null>(null);
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
      // A landed booking flips the section to its confirmed state (5a). The
      // documented V2 event carries uid + times; the deprecated V1 event
      // carries the booking object (responses, attendees, description).
      // Either event triggers the state, in any order — the two are merged.
      // The picked format is read lazily (ref, then sessionStorage) so it is
      // current at event time, whichever instance registered the handlers.
      const pickedFormat = () => formatRef.current ?? storedFormat();
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: (e) => {
          // Intentional: Cal's payload shapes drift across versions; this
          // makes a real booking diagnosable from the visitor console.
          console.debug("[dbln booking] bookingSuccessfulV2", e.detail.data);
          const d = e.detail.data;
          setConfirmed((cur) => ({
            format: cur?.format ?? pickedFormat(),
            weighing: cur?.weighing ?? null,
            attendee: cur?.attendee ?? null,
            uid: d.uid ?? cur?.uid ?? null,
            start: d.startTime ?? cur?.start ?? null,
            end: d.endTime ?? cur?.end ?? null,
          }));
        },
      });
      cal("on", {
        action: "bookingSuccessful",
        callback: (e) => {
          console.debug("[dbln booking] bookingSuccessful", e.detail.data);
          const d = e.detail.data;
          const b = extractBooking(d.booking);
          // The event root carries date + duration; derive times when the
          // booking object doesn't spell them out.
          const start =
            b.start ?? (typeof d.date === "string" && d.date ? d.date : null);
          const startMs = start ? new Date(start).getTime() : Number.NaN;
          const end =
            b.end ??
            (!Number.isNaN(startMs) && typeof d.duration === "number"
              ? new Date(startMs + d.duration * 60000).toISOString()
              : null);
          setConfirmed((cur) => ({
            format: b.format ?? cur?.format ?? pickedFormat(),
            weighing: b.weighing ?? cur?.weighing ?? null,
            attendee: b.attendee ?? cur?.attendee ?? null,
            uid: b.uid ?? cur?.uid ?? null,
            start: cur?.start ?? start,
            end: cur?.end ?? end,
          }));
        },
      });
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
    formatRef.current = next;
    storeFormat(next);
    // Fresh iframe after a format change; nothing has been clicked in it yet.
    setInteracted(false);
    setPending(null);
  };

  const requestFormat = (value: string) => {
    const next = format === value ? null : value;
    if (interacted) setPending({ next });
    else applyFormat(next);
  };

  /**
   * Reschedule and cancel hand the booking back to Cal in its own tab, and
   * what happens there is invisible to us (those flows fire no embed events).
   * Return to the resting state on the way out: a cancelled booking would
   * make the acknowledgement a lie, and a stale one is worse than none.
   */
  const handOffToCal = () => {
    setConfirmed(null);
    applyFormat(null);
  };

  const active = booking.formats.find((f) => f.value === format) ?? null;
  const veiled = !active && !confirmed;
  const showCal = inView && calReady;
  const calConfig: Record<string, string> = { layout: "month_view", theme: "light" };
  if (active) calConfig.format = active.value;
  // Focus echo: Cal's own record of the booked format wins over picker
  // state. Match the option value first, then the title (Cal select
  // responses have carried either); never show an unmapped raw slug.
  const bookedFormat = confirmed?.format?.toLowerCase() ?? null;
  const focus = confirmed
    ? (booking.formats.find(
        (f) =>
          f.value.toLowerCase() === bookedFormat ||
          f.title.toLowerCase() === bookedFormat,
      )?.title ??
      active?.title ??
      null)
    : null;
  const when = confirmed ? formatWhen(confirmed.start, confirmed.end) : null;

  return (
    <div className={styles.grid}>
      <div>
        {/* Keyed so React mounts a fresh subtree per state instead of reusing
            the Reveal instances across branches: Reveal adds its `.in` class
            imperatively, and a reused instance whose className prop changes
            gets that class overwritten by React (its mount effect, which
            would re-add it, never re-runs). */}
        {confirmed ? (
          <Fragment key="confirmed">
            {confirmedHeading}

            {(focus || confirmed.weighing) && (
              <Reveal className={styles.echo}>
                {focus && (
                  <div className={styles.echoRow}>
                    <p className={styles.echoLabel}>
                      {booking.confirmed.focusLabel}
                    </p>
                    <p className={styles.echoValue}>{focus}</p>
                  </div>
                )}
                {confirmed.weighing && (
                  <div className={styles.echoRow}>
                    <p className={styles.echoLabel}>
                      {booking.confirmed.weighingLabel}
                    </p>
                    <p className={styles.echoValue}>{confirmed.weighing}</p>
                  </div>
                )}
              </Reveal>
            )}

            <Reveal className={styles.mailRow}>
              <a className={styles.mail} href={`mailto:${email}`}>
                {email}
              </a>
              <span className={styles.mailHint}>
                {booking.confirmed.emailHint}
              </span>
            </Reveal>
          </Fragment>
        ) : (
          <Fragment key="booking">
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
          </Fragment>
        )}
      </div>

      <div>
        <Reveal as="p" className={styles.step}>
          {confirmed ? booking.confirmed.timeStep : booking.timeStep}
        </Reveal>
        <div className={styles.card} ref={cardRef}>
          {!confirmed && (
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
          )}
          {confirmed ? (
            <div className={styles.scheduled}>
              <div className={styles.scheduledCheck} aria-hidden="true">
                ✓
              </div>
              <p className={styles.scheduledTitle}>
                {booking.confirmed.card.title}
              </p>
              <p className={styles.scheduledBody}>
                {booking.confirmed.card.body}
              </p>
              <dl className={styles.scheduledDetails}>
                <dt>{booking.confirmed.card.whatLabel}</dt>
                <dd>{booking.confirmed.card.what}</dd>
                {when && (
                  <>
                    <dt>{booking.confirmed.card.whenLabel}</dt>
                    <dd>
                      {when.date}
                      <br />
                      {when.range}
                      {when.tz && ` (${when.tz})`}
                    </dd>
                  </>
                )}
                <dt>{booking.confirmed.card.whoLabel}</dt>
                <dd>
                  {hostName}
                  {confirmed.attendee && ` · ${confirmed.attendee}`}
                </dd>
                <dt>{booking.confirmed.card.whereLabel}</dt>
                <dd>{booking.confirmed.card.where}</dd>
              </dl>
              {confirmed.uid && (
                <div className={styles.scheduledActions}>
                  <a
                    href={`https://cal.com/reschedule/${confirmed.uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handOffToCal}
                  >
                    {booking.confirmed.card.reschedule}
                  </a>
                  <a
                    className={styles.scheduledCancel}
                    href={`https://cal.com/booking/${confirmed.uid}?cancel=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handOffToCal}
                  >
                    {booking.confirmed.card.cancel}
                  </a>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {!confirmed && (
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
      )}
    </div>
  );
}
