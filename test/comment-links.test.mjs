// Contract for links in comment bodies (Discussion). Imports the TS module
// directly — Node strips types natively.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCommentLinks } from "../src/lib/commentLinks.ts";

const link = (text, href) => ({ type: "link", text, href });
const text = (value) => ({ type: "text", value });

test("plain text stays one text part", () => {
  assert.deepEqual(parseCommentLinks("No links here.\nSecond line."), [
    text("No links here.\nSecond line."),
  ]);
});

test("[words](url) renders the words as the link", () => {
  assert.deepEqual(
    parseCommentLinks(
      "Follow-up: [Five ground rules for building an agent loop](https://dbln.me/blog/5-rules-for-building-reliable-ai-agents) is out.",
    ),
    [
      text("Follow-up: "),
      link(
        "Five ground rules for building an agent loop",
        "https://dbln.me/blog/5-rules-for-building-reliable-ai-agents",
      ),
      text(" is out."),
    ],
  );
});

test("bare URLs link as themselves, without swallowing prose punctuation", () => {
  assert.deepEqual(parseCommentLinks("See https://example.com/a/b."), [
    text("See "),
    link("https://example.com/a/b", "https://example.com/a/b"),
    text("."),
  ]);
  assert.deepEqual(parseCommentLinks("(details at https://example.com/x)"), [
    text("(details at "),
    link("https://example.com/x", "https://example.com/x"),
    text(")"),
  ]);
});

test("balanced parentheses inside a URL are kept", () => {
  const wiki = "https://en.wikipedia.org/wiki/Finite-state_machine_(disambiguation)";
  assert.deepEqual(parseCommentLinks(`[FSM](${wiki})`), [link("FSM", wiki)]);
  assert.deepEqual(parseCommentLinks(`see ${wiki}`), [text("see "), link(wiki, wiki)]);
});

test("several links and newlines in one body", () => {
  assert.deepEqual(
    parseCommentLinks("[One](https://a.example/1)\nand https://b.example/2"),
    [
      link("One", "https://a.example/1"),
      text("\nand "),
      link("https://b.example/2", "https://b.example/2"),
    ],
  );
});

test("only absolute http(s) URLs ever become links", () => {
  for (const body of [
    "[click](javascript:alert(1))",
    "[x](data:text/html,hi)",
    "[home](/blog/testing-ai-tools)",
    "[x](//evil.example/path)",
    "ftp://files.example/a",
  ]) {
    assert.ok(
      parseCommentLinks(body).every((p) => p.type === "text"),
      `no link expected for ${body}`,
    );
  }
});

test("a malformed link falls back to its literal text", () => {
  assert.deepEqual(parseCommentLinks("[unclosed](https://a.example"), [
    text("[unclosed]("),
    link("https://a.example", "https://a.example/"),
  ]);
  assert.deepEqual(parseCommentLinks("[label] then text"), [text("[label] then text")]);
});
