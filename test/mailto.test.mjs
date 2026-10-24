// Contract for prefilled mailto links (the first-read CTA). Imports the TS
// module directly — Node strips types natively.
import assert from "node:assert/strict";
import { test } from "node:test";
import { mailtoHref } from "../src/lib/mailto.ts";

test("subject and body are percent-encoded after the address", () => {
  assert.equal(
    mailtoHref("hello@example.com", { subject: "A first read", body: "Hi" }),
    "mailto:hello@example.com?subject=A%20first%20read&body=Hi",
  );
});

test("newlines in the body become %0A", () => {
  assert.equal(
    mailtoHref("hello@example.com", {
      subject: "Read",
      body: "Line one\nLine two\n\nLast line",
    }),
    "mailto:hello@example.com?subject=Read&body=Line%20one%0ALine%20two%0A%0ALast%20line",
  );
});

test("? & # = in the copy cannot start or cut a field", () => {
  const href = mailtoHref("hello@example.com", {
    subject: "Q&A? #1",
    body: "a=b & c?d",
  });
  assert.equal(
    href,
    "mailto:hello@example.com?subject=Q%26A%3F%20%231&body=a%3Db%20%26%20c%3Fd",
  );
  const query = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  assert.deepEqual([...query.keys()], ["subject", "body"]);
  assert.equal(query.get("subject"), "Q&A? #1");
  assert.equal(query.get("body"), "a=b & c?d");
});
