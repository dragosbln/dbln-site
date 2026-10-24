// Contract for the booking prefill store (BookingLink -> BookingFlow).
// Imports the TS module directly — Node strips types natively. The store is
// module state shared by every test here, so each test unsubscribes all its
// listeners and leaves nothing pending.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PENDING_TTL_MS,
  requestBookingFormat,
  subscribeBookingFormat,
} from "../src/lib/bookingPrefill.ts";

/** A listener that records what it receives. */
function recorder() {
  const values = [];
  return { values, listener: (value) => values.push(value) };
}

const at = (ms) => () => ms;

test("a request reaches every live subscriber", () => {
  const a = recorder();
  const b = recorder();
  const offA = subscribeBookingFormat(a.listener);
  const offB = subscribeBookingFormat(b.listener);
  requestBookingFormat("live-misbehaving");
  requestBookingFormat("pre-launch");
  offA();
  offB();
  assert.deepEqual(a.values, ["live-misbehaving", "pre-launch"]);
  assert.deepEqual(b.values, ["live-misbehaving", "pre-launch"]);
});

test("a held request goes to the first subscriber only, synchronously", () => {
  requestBookingFormat("live-unmeasured", at(1_000));
  const first = recorder();
  const offFirst = subscribeBookingFormat(first.listener, at(1_500));
  assert.deepEqual(first.values, ["live-unmeasured"]);
  const second = recorder();
  const offSecond = subscribeBookingFormat(second.listener, at(1_600));
  offFirst();
  offSecond();
  assert.deepEqual(second.values, []);
});

test("a held request is delivered until it is PENDING_TTL_MS old", () => {
  requestBookingFormat("pre-launch", at(0));
  const fresh = recorder();
  const offFresh = subscribeBookingFormat(fresh.listener, at(PENDING_TTL_MS - 1));
  offFresh();
  assert.deepEqual(fresh.values, ["pre-launch"]);
});

test("an expired held request is dropped, not delivered later", () => {
  requestBookingFormat("pre-launch", at(0));
  const late = recorder();
  const offLate = subscribeBookingFormat(late.listener, at(PENDING_TTL_MS));
  offLate();
  assert.deepEqual(late.values, []);
  // Taken by that subscriber even though it was stale: a later one gets
  // nothing either.
  const later = recorder();
  const offLater = subscribeBookingFormat(later.listener, at(PENDING_TTL_MS));
  offLater();
  assert.deepEqual(later.values, []);
});

test("unsubscribing stops delivery", () => {
  const gone = recorder();
  const stays = recorder();
  const offGone = subscribeBookingFormat(gone.listener);
  const offStays = subscribeBookingFormat(stays.listener);
  offGone();
  requestBookingFormat("other");
  offStays();
  assert.deepEqual(gone.values, []);
  assert.deepEqual(stays.values, ["other"]);
});

test("a request made while subscribed is not held for later", () => {
  const live = recorder();
  const offLive = subscribeBookingFormat(live.listener, at(0));
  requestBookingFormat("live-misbehaving", at(0));
  offLive();
  const next = recorder();
  const offNext = subscribeBookingFormat(next.listener, at(1));
  offNext();
  assert.deepEqual(live.values, ["live-misbehaving"]);
  assert.deepEqual(next.values, []);
});
