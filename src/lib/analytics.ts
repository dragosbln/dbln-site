import { site } from "@/content/site";

/**
 * Plausible wrapper (client-only — call these from client components).
 *
 * The tracker package reads `location` at module scope, so it can only be
 * evaluated in the browser: a static import would crash the Node prerender
 * during `next build`. Hence the dynamic import, latched in `tracker`.
 *
 * The privacy properties are load-bearing (see AGENTS.md, "Analytics"):
 * Plausible is cookieless and stores nothing on the device, which is what
 * lets the site run analytics without a consent banner — and keeps the
 * Cal.com click-to-load calculus intact. Never swap in a tool that sets
 * cookies or touches storage without adding consent first.
 */

const TRACKED_HOSTNAME = new URL(site.url).hostname;

/** Latched promise of the booted tracker; null wherever the gate said no. */
let tracker: Promise<typeof import("@plausible-analytics/tracker")> | null =
  null;

/**
 * The canonical host (+ www) records. Localhost boots the tracker too, but
 * the tracker itself refuses to send from there (`captureOnLocalhost` stays
 * false) and logs "Ignoring Event" instead — handy for checking the wiring.
 * Everything else — Firebase preview channels (`*.web.app`) above all —
 * stays silent, so preview traffic can't pollute the stats.
 */
function isTrackedHost(hostname: string): boolean {
  return (
    hostname === TRACKED_HOSTNAME ||
    hostname === `www.${TRACKED_HOSTNAME}` ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

/** Boots Plausible once. Called by the `Analytics` leaf in the root layout. */
export function initAnalytics(): void {
  if (tracker || typeof window === "undefined") return;
  if (!isTrackedHost(window.location.hostname)) return;
  tracker = import("@plausible-analytics/tracker").then((m) => {
    m.init({
      domain: TRACKED_HOSTNAME,
      outboundLinks: true,
    });
    return m;
  });
  tracker.catch(() => {
    tracker = null;
  });
}

/**
 * Custom event, fire-and-forget. A safe no-op when the tracker didn't boot
 * (server, preview channel, failed load) — the package's own `track` throws
 * in that case, so components never call it directly.
 */
export function track(name: string, props?: Record<string, string>): void {
  tracker
    ?.then((m) => m.track(name, props ? { props } : {}))
    .catch(() => {
      // Losing an analytics event is fine; breaking the click that fired
      // it is not.
    });
}
