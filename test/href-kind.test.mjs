// Contract for how content hrefs render (PillLink). Imports the TS module
// directly — Node strips types natively.
import assert from "node:assert/strict";
import { test } from "node:test";
import { hrefKind } from "../src/lib/hrefKind.ts";

test("mailto and tel hand off as plain anchors", () => {
  assert.equal(hrefKind("mailto:hello@example.com?subject=Hi"), "mailto");
  assert.equal(hrefKind("tel:+40700000000"), "mailto");
  assert.equal(hrefKind("MAILTO:hello@example.com"), "mailto");
});

test("http(s) URLs are external", () => {
  assert.equal(hrefKind("https://www.linkedin.com/in/someone"), "external");
  assert.equal(hrefKind("http://example.com"), "external");
});

test("pages and sections of this site are internal", () => {
  assert.equal(hrefKind("/review#contact"), "internal");
  assert.equal(hrefKind("/#contact"), "internal");
  assert.equal(hrefKind("#questions"), "internal");
  assert.equal(hrefKind("/work"), "internal");
  // A path that merely contains a scheme-like word stays internal.
  assert.equal(hrefKind("/blog/https-everywhere"), "internal");
});
