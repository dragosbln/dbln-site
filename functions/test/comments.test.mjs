/**
 * Comment API contract tests over the compiled app (pretest builds).
 * Same setup as api.test.mjs: real HTTP, MemoryStore semantics.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const require = createRequire(import.meta.url);
const { createApp } = require("../lib/app.js");
const { MemoryStore, DEPTH_LIMIT } = require("../lib/store.js");
const { SLUGS } = require("../lib/slugs.js");
const { mintToken, verifyToken, TOKEN_MIN_AGE_MS, TOKEN_MAX_AGE_MS } =
  require("../lib/token.js");

const SLUG = SLUGS[0];
const KEY = "test-token-key";
const SUBJECT = "d_2c8f7a1e-0b3d-4e5f-9a6b-7c8d9e0f1a2b";
const OTHER = "d_9d1c5b3a-4f6e-4a2b-8c0d-1e2f3a4b5c6d";
const servers = [];

/** A token already past its minimum age. */
const ripeToken = () => mintToken(KEY, Date.now() - TOKEN_MIN_AGE_MS - 500);

function start(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

after(() => servers.forEach((s) => s.close()));

/**
 * App with the comment cooldown neutralized (tested separately).
 * windowMs/cooldownMs 0 is the true off switch: SlidingWindow's cutoff is
 * strict (`> t - windowMs`), so 1ms still blocks same-millisecond posts —
 * which made the suite flaky on fast localhost runs.
 */
function mkApp(store, { limits, ...opts } = {}) {
  return createApp(store, {
    tokenKey: KEY,
    ...opts,
    limits: { commentCooldownMs: 0, ...(limits ?? {}) },
  });
}

async function postComment(base, body, extra = {}) {
  const res = await fetch(`${base}/api/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: SLUG,
      subject: SUBJECT,
      token: ripeToken(),
      website: "",
      ...body,
    }),
    ...extra,
  });
  return { status: res.status, body: await res.json() };
}

async function getThread(base, slug = SLUG) {
  const res = await fetch(`${base}/api/comments?slug=${slug}`);
  return { status: res.status, body: await res.json() };
}

test("comment roundtrip: post, read back, counts", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));

  const empty = await getThread(base);
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body.comments, []);
  assert.equal(typeof empty.body.token, "string");

  const posted = await postComment(base, { name: "Maya", body: "Well argued." });
  assert.equal(posted.status, 200);
  assert.equal(posted.body.comment.name, "Maya");
  assert.equal(posted.body.comment.depth, 0);
  assert.equal(posted.body.comment.removed, false);

  const thread = await getThread(base);
  assert.equal(thread.body.comments.length, 1);
  assert.equal(thread.body.comments[0].body, "Well argued.");

  const counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 1 });
});

test("nested replies: depth chain up to the limit, then rejected", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));

  let parentId = null;
  for (let depth = 0; depth <= DEPTH_LIMIT; depth++) {
    const r = await postComment(base, {
      name: `N${depth}`,
      body: `depth ${depth}`,
      parentId,
    });
    assert.equal(r.status, 200, `depth ${depth}`);
    assert.equal(r.body.comment.depth, depth);
    parentId = r.body.comment.id;
  }
  const over = await postComment(base, { name: "X", body: "too deep", parentId });
  assert.equal(over.status, 400);
  assert.equal(over.body.error, "depth_exceeded");

  const missing = await postComment(base, {
    name: "X",
    body: "orphan",
    parentId: "doesNotExist",
  });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error, "parent_missing");
});

test("reply to a comment on a different slug is parent_missing", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));
  const a = await postComment(base, { name: "A", body: "on slug 0" });
  const cross = await postComment(base, {
    slug: SLUGS[1],
    name: "B",
    body: "cross-slug reply",
    parentId: a.body.comment.id,
  });
  assert.equal(cross.status, 400);
  assert.equal(cross.body.error, "parent_missing");
});

test("validation: honeypot, name, body, links, parent shape", async () => {
  const base = await start(mkApp(new MemoryStore()));
  const cases = [
    [{ name: "A", body: "hi", website: "http://spam" }, "bad_request"],
    [{ name: "", body: "hi" }, "bad_name"],
    [{ name: "A".repeat(61), body: "hi" }, "bad_name"],
    [{ name: "A", body: "" }, "bad_body"],
    [{ name: "A", body: "x".repeat(1201) }, "bad_body"],
    [{ name: "A", body: "a http://1 http://2 https://3 HTTP://4" }, "too_many_links"],
    [{ name: "A", body: "hi", parentId: "../etc" }, "bad_request"],
    [{ name: "A", body: "hi", slug: "nope" }, "unknown_slug"],
    [{ name: "A", body: "hi", subject: "d_bad" }, "bad_subject"],
  ];
  for (const [body, error] of cases) {
    const r = await postComment(base, body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.equal(r.body.error, error, JSON.stringify(body));
  }
  // Control characters are stripped, newlines in the body survive.
  const cleaned = await postComment(base, {
    name: "Ma\u0007ya",
    body: "line one\nline two",
  });
  assert.equal(cleaned.body.comment.name, "Maya");
  assert.equal(cleaned.body.comment.body, "line one\nline two");
});

test("token gate: young, old, tampered, missing", async () => {
  const base = await start(mkApp(new MemoryStore()));
  const young = mintToken(KEY, Date.now());
  const old = mintToken(KEY, Date.now() - TOKEN_MAX_AGE_MS - 1000);
  const tampered = `${ripeToken().split(".")[0]}.${"0".repeat(64)}`;
  for (const token of [young, old, tampered, undefined, "x"]) {
    const r = await postComment(base, { name: "A", body: "hi", token });
    assert.equal(r.status, 400, String(token));
    assert.equal(r.body.error, "token");
  }
  // Unit level: verify round-trips and rejects a wrong key.
  const t = ripeToken();
  assert.equal(verifyToken(KEY, t), true);
  assert.equal(verifyToken("other-key", t), false);
});

test("cooldown: second immediate post from the same subject is 429", async () => {
  const base = await start(
    createApp(new MemoryStore(), { tokenKey: KEY }), // real 30s cooldown
  );
  const first = await postComment(base, { name: "A", body: "one" });
  assert.equal(first.status, 200);
  const second = await postComment(base, { name: "A", body: "two" });
  assert.equal(second.status, 429);
  // A different subject is not blocked.
  const other = await postComment(base, { name: "B", body: "three", subject: OTHER });
  assert.equal(other.status, 200);
});

test("removed comments become placeholders only while replies are visible", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));
  const parent = await postComment(base, { name: "P", body: "parent" });
  const reply = await postComment(base, {
    name: "R",
    body: "reply",
    parentId: parent.body.comment.id,
    subject: OTHER,
  });

  await store.setCommentStatus(parent.body.comment.id, "removed");
  let thread = (await getThread(base)).body.comments;
  assert.equal(thread.length, 2);
  const placeholder = thread.find((c) => c.id === parent.body.comment.id);
  assert.deepEqual(
    { removed: placeholder.removed, name: placeholder.name, body: placeholder.body },
    { removed: true, name: "", body: "" },
  );

  await store.setCommentStatus(reply.body.comment.id, "removed");
  thread = (await getThread(base)).body.comments;
  assert.deepEqual(thread, []);

  const counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 0 });

  // Replying to a removed parent is refused.
  const late = await postComment(base, {
    name: "L",
    body: "late",
    parentId: parent.body.comment.id,
  });
  assert.equal(late.status, 400);
  assert.equal(late.body.error, "parent_missing");
});

test("comment-specific rate windows answer 429", async () => {
  const store = new MemoryStore();
  const base = await start(
    mkApp(store, { limits: { commentsPerSubject: 2, commentsGlobal: 100 } }),
  );
  for (let i = 0; i < 3; i++) {
    const r = await postComment(base, { name: "A", body: `post ${i}` });
    assert.equal(r.status, i < 2 ? 200 : 429, `subject window, post ${i}`);
  }
  // Global ceiling: rotating subjects doesn't escape it.
  const capped = await start(
    mkApp(new MemoryStore(), {
      limits: { commentsPerSubject: 100, commentsGlobal: 2 },
    }),
  );
  const subjects = [SUBJECT, OTHER, "d_77777777-7777-4777-8777-777777777777"];
  for (let i = 0; i < 3; i++) {
    const r = await postComment(capped, {
      name: "A",
      body: `post ${i}`,
      subject: subjects[i],
    });
    assert.equal(r.status, i < 2 ? 200 : 429, `global ceiling, post ${i}`);
  }
});

test("thread cap: the 1000th visible comment closes the thread with 409", async () => {
  const store = new MemoryStore();
  // Seed just below the cap directly through the store (HTTP would take
  // 1000 requests); the cap gates on the VISIBLE counter.
  for (let i = 0; i < 999; i++) {
    const r = await store.addComment({
      slug: SLUG,
      parentId: null,
      name: "Seed",
      body: `seed ${i}`,
      subject: SUBJECT,
    });
    assert.equal(r.ok, true);
  }
  const base = await start(mkApp(store));
  const last = await postComment(base, { name: "A", body: "the 1000th" });
  assert.equal(last.status, 200);
  const over = await postComment(base, {
    name: "B",
    body: "one too many",
    subject: OTHER,
  });
  assert.equal(over.status, 409);
  assert.equal(over.body.error, "thread_closed");
});

test("restore re-increments the visible counter", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));
  const posted = await postComment(base, { name: "A", body: "hello" });
  const id = posted.body.comment.id;

  await store.setCommentStatus(id, "removed");
  let counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 0 });

  await store.setCommentStatus(id, "visible");
  counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 1 });
  // Idempotent: restoring an already-visible comment changes nothing.
  await store.setCommentStatus(id, "visible");
  counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 1 });
});

test("notification fires per comment and its failure never breaks the post", async () => {
  const sent = [];
  let failNext = false;
  const mailer = {
    send: async (m) => {
      if (failNext) throw new Error("smtp down");
      sent.push(m);
    },
  };
  const base = await start(mkApp(new MemoryStore(), { mailer }));

  const ok = await postComment(base, { name: "Maya", body: "Well argued." });
  assert.equal(ok.status, 200);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, new RegExp(SLUG));
  assert.match(sent[0].text, /Maya/);
  assert.match(sent[0].text, /Well argued\./);

  failNext = true;
  const still = await postComment(base, { name: "B", body: "again", subject: OTHER });
  assert.equal(still.status, 200);
});
