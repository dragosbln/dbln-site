/**
 * Signed-in commenting (phase 4): authed posts, delete-own, and claim.
 * The visitor verifier is injected (prod uses Firebase ID tokens); a
 * token shaped "devuid:<id>" authenticates as that uid.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const require = createRequire(import.meta.url);
const { createApp } = require("../lib/app.js");
const { MemoryStore } = require("../lib/store.js");
const { SLUGS } = require("../lib/slugs.js");
const { mintToken, TOKEN_MIN_AGE_MS } = require("../lib/token.js");

const SLUG = SLUGS[0];
const KEY = "test-token-key";
const DEVICE = "d_2c8f7a1e-0b3d-4e5f-9a6b-7c8d9e0f1a2b";
const DEVICE2 = "d_9d1c5b3a-4f6e-4a2b-8c0d-1e2f3a4b5c6d";
const servers = [];

const ripe = () => mintToken(KEY, Date.now() - TOKEN_MIN_AGE_MS - 500);

function start(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

after(() => servers.forEach((s) => s.close()));

function mkApp(store, opts = {}) {
  return createApp(store, {
    tokenKey: KEY,
    limits: { commentCooldownMs: 0 },
    verifyVisitor: async (token) => {
      const m = /^devuid:([A-Za-z0-9]{1,40})$/.exec(token ?? "");
      return m ? m[1] : null;
    },
    ...opts,
  });
}

async function post(base, body) {
  const res = await fetch(`${base}/api/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: SLUG, token: ripe(), website: "", ...body }),
  });
  return { status: res.status, body: await res.json() };
}

async function call(base, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("signed-in post derives subject from the verified uid, marks verified", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));
  const r = await post(base, { name: "Ada", body: "signed in", idToken: "devuid:ada" });
  assert.equal(r.status, 200);
  assert.equal(r.body.comment.verified, true);
  const stored = (await store.listComments())[0];
  assert.equal(stored.subject, "u_ada");
  // A client-supplied subject is ignored when a token is present.
  const r2 = await post(base, {
    name: "Ada",
    body: "again",
    idToken: "devuid:ada",
    subject: "d_ffffffff-ffff-4fff-8fff-ffffffffffff",
  });
  assert.equal(r2.status, 200);
  assert.equal((await store.listComments())[0].subject, "u_ada");
});

test("author badge: computed at read time from the admin allowlist", async () => {
  const store = new MemoryStore();
  // "ada" is on the allowlist → author; "bob" is signed-in but not.
  const base = await start(mkApp(store, { adminUids: ["ada"] }));

  const authorPost = await post(base, { name: "Ada", body: "hi", idToken: "devuid:ada" });
  assert.equal(authorPost.body.comment.author, true);
  assert.equal(authorPost.body.comment.verified, true);

  const memberPost = await post(base, { name: "Bob", body: "yo", idToken: "devuid:bob" });
  assert.equal(memberPost.body.comment.author, false);
  assert.equal(memberPost.body.comment.verified, true);

  const guestPost = await post(base, { name: "Cat", body: "meow", subject: DEVICE });
  assert.equal(guestPost.body.comment.author, false);
  assert.equal(guestPost.body.comment.verified, false);

  const thread = (await (await fetch(`${base}/api/comments?slug=${SLUG}`)).json())
    .comments;
  const byName = Object.fromEntries(thread.map((c) => [c.name, c]));
  assert.equal(byName.Ada.author, true);
  assert.equal(byName.Bob.author, false);
  assert.equal(byName.Cat.author, false);
});

test("author badge reflows: same comment, list flipped", async () => {
  const store = new MemoryStore();
  // Not an author when posted.
  await start(mkApp(store));
  const nobody = await start(mkApp(store));
  const posted = await post(nobody, { name: "Ada", body: "hi", idToken: "devuid:ada" });
  assert.equal(posted.body.comment.author, false);

  // A second app instance WITH ada on the allowlist marks the same stored
  // comment as author — proving read-time computation, not stored state.
  const withAuthor = await start(mkApp(store, { adminUids: ["ada"] }));
  const thread = (await (await fetch(`${withAuthor}/api/comments?slug=${SLUG}`)).json())
    .comments;
  assert.equal(thread.find((c) => c.name === "Ada").author, true);
});

test("bad or absent visitor token: 401 with a token, anon still allowed", async () => {
  const base = await start(mkApp(new MemoryStore()));
  const bad = await post(base, { name: "X", body: "hi", idToken: "garbage" });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error, "auth");
  const anon = await post(base, { name: "X", body: "hi", subject: DEVICE });
  assert.equal(anon.status, 200);
  assert.equal(anon.body.comment.verified, false);
});

test("delete-own: authed by token, anon by device id, with ownership enforced", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));

  const mine = await post(base, { name: "Me", body: "mine", subject: DEVICE });
  const theirs = await post(base, { name: "You", body: "yours", subject: DEVICE2 });
  const authed = await post(base, { name: "Ada", body: "authed", idToken: "devuid:ada" });

  // Anon can't delete someone else's comment (wrong device id).
  let r = await call(base, "/api/comments/mine/remove", {
    id: theirs.body.comment.id,
    subject: DEVICE,
  });
  assert.equal(r.status, 403);
  assert.equal(r.body.error, "not_owner");

  // Anon deletes their own.
  r = await call(base, "/api/comments/mine/remove", {
    id: mine.body.comment.id,
    subject: DEVICE,
  });
  assert.equal(r.status, 200);

  // Authed can't delete via the wrong account.
  r = await call(base, "/api/comments/mine/remove", {
    id: authed.body.comment.id,
    idToken: "devuid:bob",
  });
  assert.equal(r.status, 403);

  // Authed deletes their own.
  r = await call(base, "/api/comments/mine/remove", {
    id: authed.body.comment.id,
    idToken: "devuid:ada",
  });
  assert.equal(r.status, 200);

  // Unknown id → 404.
  r = await call(base, "/api/comments/mine/remove", {
    id: "nope123",
    subject: DEVICE,
  });
  assert.equal(r.status, 404);

  // The soft-removes are reflected in the reader thread + counts.
  const readers = await (await fetch(`${base}/api/comments?slug=${SLUG}`)).json();
  assert.deepEqual(
    readers.comments.map((c) => c.removed),
    // "yours" is the only one still visible.
    readers.comments.map((c) => c.name === ""),
  );
  const counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.equal(counts.comments[SLUG], 1);
});

test("expensive token verification sits behind the cheap gates and limiters", async () => {
  const calls = { n: 0 };
  const spyVerifier = async (token) => {
    calls.n += 1;
    const m = /^devuid:([A-Za-z0-9]{1,40})$/.exec(token ?? "");
    return m ? m[1] : null;
  };
  const store = new MemoryStore();
  const base = await start(
    createApp(store, {
      tokenKey: KEY,
      limits: { commentCooldownMs: 0, commentsPerClient: 2, commentsGlobal: 100 },
      verifyVisitor: spyVerifier,
    }),
  );

  // A bad page token stops the request BEFORE the verifier runs.
  const badPage = await post(base, {
    name: "A",
    body: "hi",
    idToken: "devuid:ada",
    token: "not-a-token",
  });
  assert.equal(badPage.status, 400);
  assert.equal(badPage.body.error, "token");
  assert.equal(calls.n, 0);

  // The client window throttles before the verifier once exhausted:
  // 2 allowed (verifier runs), the 3rd is 429 with no verifier call.
  for (let i = 0; i < 2; i++) {
    const r = await post(base, { name: "A", body: `p${i}`, idToken: "devuid:ada" });
    assert.equal(r.status, 200);
  }
  assert.equal(calls.n, 2);
  const limited = await post(base, { name: "A", body: "p3", idToken: "devuid:ada" });
  assert.equal(limited.status, 429);
  assert.equal(calls.n, 2);
});

test("claim moves this browser's comments into the account, then deletable by token", async () => {
  const store = new MemoryStore();
  const base = await start(mkApp(store));
  const a = await post(base, { name: "Me", body: "one", subject: DEVICE });
  await post(base, { name: "Me", body: "two", subject: DEVICE });

  const r = await call(base, "/api/account/claim", {
    idToken: "devuid:ada",
    deviceId: DEVICE,
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.moved, 2);

  const rows = await store.listComments();
  assert.ok(rows.every((c) => c.subject === "u_ada" && c.verified === true));

  // Now the account can delete a claimed comment from anywhere.
  const del = await call(base, "/api/comments/mine/remove", {
    id: a.body.comment.id,
    idToken: "devuid:ada",
  });
  assert.equal(del.status, 200);

  // Claim needs a valid token + a valid device id.
  const bad = await call(base, "/api/account/claim", {
    idToken: "garbage",
    deviceId: DEVICE,
  });
  assert.equal(bad.status, 401);
  const bad2 = await call(base, "/api/account/claim", {
    idToken: "devuid:ada",
    deviceId: "not-a-device",
  });
  assert.equal(bad2.status, 400);
});
