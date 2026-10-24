/**
 * The open rules of the review rail (section 02 of /review). One stop is
 * open at a time. The branch card has its own column on desktop, so there it
 * keeps its own state beside whichever stop is open; on phone it sits inline
 * in the rail and follows the stops' rule, so opening it closes the stop and
 * opening a stop closes it. Crossing into phone with both open keeps the
 * stop. Ported from the prototype's `tog` and `normalise`; pure, so
 * `RailBody` stays a view and the rules are unit-tested
 * (test/rail-open.test.mjs).
 */
export type RailOpenState = { stop: number | null; branch: boolean };

export const RAIL_ALL_CLOSED: RailOpenState = { stop: null, branch: false };

/** Applies the phone rule to a state that may have been set on desktop. */
export function normaliseRailOpen(
  open: RailOpenState,
  phone: boolean,
): RailOpenState {
  return phone && open.stop !== null && open.branch
    ? { ...open, branch: false }
    : open;
}

export function toggleRailStop(
  open: RailOpenState,
  index: number,
  phone: boolean,
): RailOpenState {
  if (open.stop === index) return { ...open, stop: null };
  return { stop: index, branch: phone ? false : open.branch };
}

export function toggleRailBranch(
  open: RailOpenState,
  phone: boolean,
): RailOpenState {
  if (open.branch) return { ...open, branch: false };
  return { stop: phone ? null : open.stop, branch: true };
}
