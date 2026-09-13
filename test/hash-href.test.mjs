// Contract for section hrefs (HashLink). Imports the TS module directly —
// Node strips types natively.
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveHashHref } from "../src/lib/hashHref.ts";

test("section of the current page becomes a relative hash", () => {
  assert.deepEqual(resolveHashHref("/#contact", "/"), {
    href: "#contact",
    id: "contact",
  });
  assert.deepEqual(resolveHashHref("/work#pie", "/work"), {
    href: "#pie",
    id: "pie",
  });
});

test("bare hash always targets the current page", () => {
  assert.deepEqual(resolveHashHref("#pie", "/work"), {
    href: "#pie",
    id: "pie",
  });
});

test("section of another page passes through", () => {
  assert.deepEqual(resolveHashHref("/#contact", "/work"), {
    href: "/#contact",
    id: null,
  });
  assert.deepEqual(resolveHashHref("/#contact", "/blog/some-post"), {
    href: "/#contact",
    id: null,
  });
  assert.deepEqual(resolveHashHref("https://example.com/#top", "/"), {
    href: "https://example.com/#top",
    id: null,
  });
});

test("hrefs without a section pass through", () => {
  assert.deepEqual(resolveHashHref("/blog", "/blog"), {
    href: "/blog",
    id: null,
  });
  assert.deepEqual(resolveHashHref("/#", "/"), { href: "/#", id: null });
});
