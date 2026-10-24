import type { BookingFormatValue } from "@/content/types";

/**
 * Carries a situation from a `BookingLink` click to the booking picker in
 * `BookingFlow`.
 *
 * A situation card may sit on another page than the booking section, so the
 * request has to outlive the click: it must survive the client-side
 * navigation and reach the `BookingFlow` that mounts fresh on the target
 * page. A request nobody is listening for is therefore held and handed to the
 * next subscriber, once. The hold expires after `PENDING_TTL_MS`, so a request
 * whose navigation never reached a booking section can't reselect the picker
 * after a later, unrelated navigation. A request with a live subscriber is
 * delivered and dropped: holding it too would replay it on the next mount.
 * The flip side: on a page that mounts its own booking section, that section
 * takes every request, so a `BookingLink` there must target it, not another
 * page's.
 *
 * Every value here is a visitor's click on this site, never something read
 * back from the URL or from storage. That is what lets `BookingFlow` treat it
 * as a pick, and a pick is the explicit request that loads Cal.com
 * (click-to-load, AGENTS.md "Contact booking"). Keep it that way: a value
 * restored from a shared or reloaded URL would contact Cal without a click.
 *
 * Plain module state, no DOM and no React: it lives as long as the page's
 * JavaScript, which is exactly the span of client-side navigations.
 */

/** How long a request with no subscriber waits for a booking section. */
export const PENDING_TTL_MS = 10_000;

type Listener = (value: BookingFormatValue) => void;

const listeners = new Set<Listener>();
let pending: { value: BookingFormatValue; at: number } | null = null;

/**
 * Asks the booking picker to select `value`. `now` is the clock, a parameter
 * only so tests can move time; callers leave it out.
 */
export function requestBookingFormat(
  value: BookingFormatValue,
  now: () => number = Date.now,
): void {
  if (listeners.size === 0) {
    pending = { value, at: now() };
    return;
  }
  // A copy: a listener that subscribes or unsubscribes while being called
  // must not change who receives this request.
  for (const listener of [...listeners]) listener(value);
}

/**
 * Calls `listener` with every request from now on, and first, synchronously,
 * with a held request younger than `PENDING_TTL_MS`. Returns the unsubscribe.
 * `now` is the clock, as in `requestBookingFormat`.
 */
export function subscribeBookingFormat(
  listener: Listener,
  now: () => number = Date.now,
): () => void {
  listeners.add(listener);
  // Taken by the first subscriber whether or not it is still fresh: an
  // expired request must not wait for a later mount either.
  const held = pending;
  pending = null;
  if (held && now() - held.at < PENDING_TTL_MS) listener(held.value);
  return () => {
    listeners.delete(listener);
  };
}
