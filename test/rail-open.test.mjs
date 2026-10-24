// The review rail's open rules (section 02 of /review). Imports the TS
// module directly — Node strips types natively.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RAIL_ALL_CLOSED,
  normaliseRailOpen,
  toggleRailBranch,
  toggleRailStop,
} from "../src/lib/railOpen.ts";

const DESKTOP = false;
const PHONE = true;

test("one stop open at a time; the open stop toggles closed", () => {
  const one = toggleRailStop(RAIL_ALL_CLOSED, 1, DESKTOP);
  assert.deepEqual(one, { stop: 1, branch: false });
  assert.deepEqual(toggleRailStop(one, 2, DESKTOP), { stop: 2, branch: false });
  assert.deepEqual(toggleRailStop(one, 1, DESKTOP), { stop: null, branch: false });
});

test("desktop: the branch is independent of the stops", () => {
  const stopOpen = { stop: 2, branch: false };
  const both = toggleRailBranch(stopOpen, DESKTOP);
  assert.deepEqual(both, { stop: 2, branch: true });
  assert.deepEqual(toggleRailStop(both, 3, DESKTOP), { stop: 3, branch: true });
  assert.deepEqual(toggleRailStop(both, 2, DESKTOP), { stop: null, branch: true });
  assert.deepEqual(toggleRailBranch(both, DESKTOP), { stop: 2, branch: false });
});

test("phone: the branch joins the one-open rule", () => {
  const stopOpen = { stop: 2, branch: false };
  const branchOpen = toggleRailBranch(stopOpen, PHONE);
  assert.deepEqual(branchOpen, { stop: null, branch: true });
  assert.deepEqual(toggleRailStop(branchOpen, 4, PHONE), { stop: 4, branch: false });
  assert.deepEqual(toggleRailBranch(branchOpen, PHONE), { stop: null, branch: false });
});

test("crossing into phone with both open keeps the stop and closes the branch", () => {
  const both = { stop: 2, branch: true };
  assert.deepEqual(normaliseRailOpen(both, PHONE), { stop: 2, branch: false });
  assert.equal(normaliseRailOpen(both, DESKTOP), both);
  const branchOnly = { stop: null, branch: true };
  assert.equal(normaliseRailOpen(branchOnly, PHONE), branchOnly);
  assert.equal(normaliseRailOpen(RAIL_ALL_CLOSED, PHONE), RAIL_ALL_CLOSED);
});
