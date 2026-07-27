/**
 * Admin API contract tests over the compiled app (pretest builds).
 * The verifier is injected (prod uses Firebase ID tokens + an allowlist),
 * so these cover the routes' auth gate and effects, not Firebase Auth.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const require = createRequire(import.meta.url);
const { createApp } = require("../lib/app.js");
const { MemoryStore } = require("../lib/store.js");
const { SLUGS } = require("../lib/slugs.js");
const { bearer } = require("../lib/admin.js");
const { mintToken, TOKEN_MIN_AGE_MS } = require("../lib/token.js");

const SLUG = SLUGS[0];
const KEY = "test-token-key";
const SUBJECT = "d_2c8f7a1e-0b3d-4e5f-9a6b-7c8d9e0f1a2b";
const ADMIN_TOKEN = "valid-admin-token";
const servers = [];

function start(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

after(() => servers.forEach((s) => s.close()));

function mkAdminApp(store) {
  return createApp(store, {
    tokenKey: KEY,
    limits: { commentCooldownMs: 0 },
    verifyAdmin: async (token) => (token === ADMIN_TOKEN ? "admin-uid" : null),
  });
}

async function seedComment(store, body, opts = {}) {
  const r = await store.addComment({
    slug: SLUG,
    parentId: null,
    name: "Seed",
    body,
    subject: SUBJECT,
    ...opts,
  });
  assert.equal(r.ok, true);
  return r.comment.id;
}

async function adminReq(base, path, { method = "GET", body, token = ADMIN_TOKEN } = {}) {
  const res = await fetch(`${base}/api/admin${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
}

test("admin API is absent entirely when no verifier is configured", async () => {
  const base = await start(createApp(new MemoryStore(), { tokenKey: KEY }));
  const r = await fetch(`${base}/api/admin/overview`, {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  assert.equal(r.status, 404);
});

test("auth gate: missing, malformed and wrong tokens are 401", async () => {
  const base = await start(mkAdminApp(new MemoryStore()));
  for (const headers of [
    {},
    { authorization: "Bearer nope" },
    { authorization: "Basic abc" },
    { authorization: `bearer${ADMIN_TOKEN}` },
  ]) {
    const r = await fetch(`${base}/api/admin/overview`, { headers });
    assert.equal(r.status, 401, JSON.stringify(headers));
  }
  assert.equal(bearer("Bearer abc"), "abc");
  assert.equal(bearer(" Bearer abc "), "abc");
  assert.equal(bearer("Basic abc"), null);
  assert.equal(bearer(undefined), null);
});

test("overview returns counts, all comments (removed included) and like events", async () => {
  const store = new MemoryStore();
  const id = await seedComment(store, "visible one");
  const removedId = await seedComment(store, "will be removed", {
    subject: "d_9d1c5b3a-4f6e-4a2b-8c0d-1e2f3a4b5c6d",
  });
  await store.setCommentStatus(removedId, "removed");
  await store.toggleLike(SLUG, SUBJECT, "like");

  const base = await start(mkAdminApp(store));
  const r = await adminReq(base, "/overview");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.counts.likes, { [SLUG]: 1 });
  assert.deepEqual(r.body.counts.comments, { [SLUG]: 1 });
  assert.equal(r.body.comments.length, 2);
  // Admin sees full rows: status, subject, body of removed comments too.
  const removed = r.body.comments.find((c) => c.id === removedId);
  assert.equal(removed.status, "removed");
  assert.equal(removed.body, "will be removed");
  assert.ok(removed.subject.startsWith("d_"));
  assert.equal(r.body.likeEvents.length, 1);
  assert.equal(r.body.likeEvents[0].action, "like");
  assert.ok(id);
});

test("remove hides from readers, restore brings back, both adjust counts", async () => {
  const store = new MemoryStore();
  const id = await seedComment(store, "moderate me");
  const base = await start(mkAdminApp(store));

  let r = await adminReq(base, "/comments/remove", { method: "POST", body: { id } });
  assert.equal(r.status, 200);
  let readers = await (await fetch(`${base}/api/comments?slug=${SLUG}`)).json();
  assert.deepEqual(readers.comments, []);

  r = await adminReq(base, "/comments/restore", { method: "POST", body: { id } });
  assert.equal(r.status, 200);
  readers = await (await fetch(`${base}/api/comments?slug=${SLUG}`)).json();
  assert.equal(readers.comments.length, 1);
  const counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 1 });
});

test("purge deletes the record and unknown/invalid ids are handled", async () => {
  const store = new MemoryStore();
  const id = await seedComment(store, "gdpr delete");
  const base = await start(mkAdminApp(store));

  let r = await adminReq(base, "/comments/purge", { method: "POST", body: { id } });
  assert.equal(r.status, 200);
  assert.equal((await store.listComments()).length, 0);
  const counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts.comments, { [SLUG]: 0 });

  r = await adminReq(base, "/comments/purge", { method: "POST", body: { id } });
  assert.equal(r.status, 404);
  r = await adminReq(base, "/comments/remove", { method: "POST", body: { id: "../x" } });
  assert.equal(r.status, 400);
});

test("purge cascades to descendants and decrements only visible ones", async () => {
  const store = new MemoryStore();
  const parent = await seedComment(store, "parent");
  const child = (
    await store.addComment({
      slug: SLUG,
      parentId: parent,
      name: "R",
      body: "child",
      subject: "d_9d1c5b3a-4f6e-4a2b-8c0d-1e2f3a4b5c6d",
    })
  ).comment.id;
  const grandchild = (
    await store.addComment({
      slug: SLUG,
      parentId: child,
      name: "R2",
      body: "grandchild",
      subject: "d_77777777-7777-4777-8777-777777777777",
    })
  ).comment.id;
  // Remove the grandchild first: it must not be double-counted on purge.
  await store.setCommentStatus(grandchild, "removed");

  const base = await start(mkAdminApp(store));
  const r = await adminReq(base, "/comments/purge", { method: "POST", body: { id: parent } });
  assert.equal(r.status, 200);
  // Whole subtree gone — no orphaned reply left behind.
  assert.equal((await store.listComments()).length, 0);
  const after = await (await fetch(`${base}/api/social/counts`)).json();
  // parent + child were visible (−2); grandchild was already removed (0).
  assert.deepEqual(after.comments, { [SLUG]: 0 });
  const readers = await (await fetch(`${base}/api/comments?slug=${SLUG}`)).json();
  assert.deepEqual(readers.comments, []);
});

test("GET /comments?slug filters without needing a composite index", async () => {
  const store = new MemoryStore();
  await seedComment(store, "on slug 0");
  await store.addComment({
    slug: SLUGS[1],
    parentId: null,
    name: "B",
    body: "on slug 1",
    subject: SUBJECT,
  });
  const base = await start(mkAdminApp(store));
  const r = await adminReq(base, `/comments?slug=${SLUG}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.comments.length, 1);
  assert.equal(r.body.comments[0].slug, SLUG);
});

test("overview reports truncation past the shown cap", async () => {
  const store = new MemoryStore();
  for (let i = 0; i < 201; i++) {
    await store.addComment({
      slug: SLUG,
      parentId: null,
      name: "Seed",
      body: `c${i}`,
      subject: SUBJECT,
    });
  }
  const base = await start(mkAdminApp(store));
  const r = await adminReq(base, "/overview");
  assert.equal(r.status, 200);
  assert.equal(r.body.comments.length, 200);
  assert.equal(r.body.hasMore.comments, true);
  assert.equal(r.body.hasMore.likeEvents, false);
});

test("admin actions never leak into the public thread payload", async () => {
  const store = new MemoryStore();
  await seedComment(store, "public view check");
  const base = await start(mkAdminApp(store));
  // Post one real comment through the public API for a realistic row.
  const token = mintToken(KEY, Date.now() - TOKEN_MIN_AGE_MS - 500);
  await fetch(`${base}/api/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: SLUG,
      subject: "d_9d1c5b3a-4f6e-4a2b-8c0d-1e2f3a4b5c6d",
      token,
      website: "",
      name: "Reader",
      body: "hello",
    }),
  });
  const readers = await (await fetch(`${base}/api/comments?slug=${SLUG}`)).json();
  for (const c of readers.comments) {
    assert.deepEqual(
      Object.keys(c).sort(),
      [
        "at",
        "author",
        "body",
        "depth",
        "id",
        "name",
        "parentId",
        "removed",
        "verified",
      ],
      "public payload must not carry subject/status/slug",
    );
  }
});
