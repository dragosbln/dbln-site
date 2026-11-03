"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ArrowIcon from "@/components/ArrowIcon";
import CalendarIcon from "@/components/CalendarIcon";
import type { HomeBooking } from "@/content/types";
import { track } from "@/lib/analytics";
import { CAL_CSS_VARS } from "@/lib/calTheme";
import styles from "./Booking.module.css";

/** Own namespace: `BookingFlow`'s ("booking") registers its own handlers. */
const CAL_NAMESPACE = "home";

/** How long the booker may take before the status offers the email fallback. */
const SLOW_LOAD_MS = 15_000;

type Phase = "idle" | "loading" | "ready" | "slow" | "failed";

type CalendarGateProps = {
  copy: HomeBooking["card"];
  /** Cal.com link path ("dragosbln/30min"). */
  calLink: string;
  email: string;
};

/**
 * The booking card: a site-authored header and a gate with one button until
 * the visitor asks for the calendar; then a status line while the booker
 * loads, and the Cal.com inline embed once it is ready.
 *
 * Click-to-load is a privacy boundary (AGENTS.md, "Contact booking"): nothing
 * is requested from Cal.com — no embed script, no iframe, no preconnect —
 * until the button is pressed, so a visitor who only reads the page contacts
 * no third party. Don't "optimise" it by preloading. The boot is latched to
 * run once: `cal("on", …)` adds window listeners that are never removed.
 *
 * Once the booker is up, Cal's own event details show (with the timezone
 * selector), so the site-authored header leaves the card; the `ui`
 * instruction is one-shot and re-applied on every `linkReady`.
 */
export default function CalendarGate({ copy, calLink, email }: CalendarGateProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  /** The embed mounts only once Cal's API is up and the handlers are registered. */
  const [calReady, setCalReady] = useState(false);
  const booted = useRef(false);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);

  const started = phase !== "idle";
  const ready = phase === "ready";

  // The click is the visitor's request for the booking service: only then
  // does the embed script load. Runs once, on the first phase change.
  useEffect(() => {
    if (!started || booted.current) return;
    booted.current = true;
    const ui = {
      hideEventTypeDetails: false,
      layout: "month_view" as const,
      cssVarsPerTheme: { light: CAL_CSS_VARS, dark: CAL_CSS_VARS },
    };
    const slowTimer = window.setTimeout(() => {
      setPhase((current) => (current === "loading" ? "slow" : current));
    }, SLOW_LOAD_MS);
    (async () => {
      try {
        const cal = await getCalApi({ namespace: CAL_NAMESPACE });
        cal("ui", ui);
        cal("on", {
          action: "linkReady",
          callback: () => {
            window.clearTimeout(slowTimer);
            cal("ui", ui);
            const frame = slotRef.current?.querySelector("iframe");
            if (frame) {
              frame.title = copy.iframeTitle;
              // The status line held focus while loading; hand it on before
              // the line leaves the page.
              if (document.activeElement === statusRef.current) {
                frame.focus({ preventScroll: true });
              }
            }
            setPhase("ready");
          },
        });
        cal("on", {
          action: "bookingSuccessfulV2",
          // No situation picker here, so the format prop names its absence.
          callback: () => track("Booking Confirmed", { format: "none" }),
        });
        setCalReady(true);
      } catch {
        window.clearTimeout(slowTimer);
        setPhase("failed");
      }
    })();
  }, [started, copy.iframeTitle]);

  // The status line announces the load and takes focus so a keyboard
  // visitor isn't left on the button that just disappeared.
  useEffect(() => {
    if (phase === "loading") statusRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const open = () => {
    if (started) return;
    setPhase("loading");
    track("Booking Calendar Opened");
  };

  const fallback = phase === "slow" || phase === "failed";

  return (
    <div className={styles.card} aria-labelledby="booking-card-title">
      {!ready && (
        <div className={styles.cardHead}>
          <p className={styles.event} id="booking-card-title">
            {copy.title}
          </p>
          <p className={styles.eventMeta}>{copy.meta}</p>
        </div>
      )}
      {!started && (
        <div className={styles.gate}>
          <CalendarIcon className={styles.calendarIcon} />
          <button
            type="button"
            className={styles.load}
            onClick={open}
            aria-controls="home-cal-slot"
            aria-describedby="booking-privacy-note"
          >
            {copy.button} <ArrowIcon />
          </button>
          <p className={styles.note} id="booking-privacy-note">
            {copy.note}{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
              {copy.privacyLabel}
            </Link>
          </p>
        </div>
      )}
      <p
        ref={statusRef}
        className={styles.status}
        role="status"
        tabIndex={-1}
        hidden={!started || ready}
      >
        {phase === "loading" && copy.loading}
        {fallback && (
          <>
            {phase === "slow" ? copy.slow : copy.failed}{" "}
            <a href={`mailto:${email}`}>{copy.emailFallback}</a>
          </>
        )}
      </p>
      <div
        ref={slotRef}
        id="home-cal-slot"
        className={styles.calendar}
        role="region"
        aria-label={copy.slotLabel}
        aria-busy={started && !ready}
        hidden={!started}
      >
        {calReady && (
          <Cal
            namespace={CAL_NAMESPACE}
            calLink={calLink}
            config={{ layout: "month_view", theme: "light" }}
          />
        )}
      </div>
    </div>
  );
}
