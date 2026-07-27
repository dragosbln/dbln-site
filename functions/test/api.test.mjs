/**
 * API contract tests over the compiled app (pretest builds). HTTP goes
 * through a real server + fetch so routing, parsing, headers and status
 * codes are all exercised exactly as production sees them; the store is
 * the MemoryStore, whose semantics mirror FirestoreStore.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const require = createRequire(import.meta.url);
const { createApp, hostAllowed, clientKey } = require("../lib/app.js");
const { MemoryStore } = require("../lib/store.js");
const { SLUGS } = require("../lib/slugs.js");
const { SlidingWindow } = require("../lib/ratelimit.js");

const SLUG = SLUGS[0];
const SUBJECT = "d_2c8f7a1e-0b3d-4e5f-9a6b-7c8d9e0f1a2b";
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

async function post(base, body, headers = {}) {
  const res = await fetch(`${base}/api/likes`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("counts start empty, with CDN cache headers", async () => {
  const base = await start(createApp(new MemoryStore()));
  const res = await fetch(`${base}/api/social/counts`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control"), /s-maxage=60/);
  assert.deepEqual(await res.json(), { likes: {}, comments: {} });
});

test("like → unlike lifecycle keeps counts and records honest", async () => {
  const store = new MemoryStore();
  const base = await start(createApp(store));

  let r = await post(base, { slug: SLUG, subject: SUBJECT, action: "like" });
  assert.deepEqual(r, { status: 200, body: { likes: 1, liked: true } });

  // Same subject liking again is a no-op: no double count, no new record.
  r = await post(base, { slug: SLUG, subject: SUBJECT, action: "like" });
  assert.deepEqual(r.body, { likes: 1, liked: true });
  assert.equal(store.dump().events.length, 1);

  // A second subject counts.
  const other = "d_9d1c5b3a-4f6e-4a2b-8c0d-1e2f3a4b5c6d";
  r = await post(base, { slug: SLUG, subject: other, action: "like" });
  assert.deepEqual(r.body, { likes: 2, liked: true });

  // Unlike drops the count and appends a record (3 changes total).
  r = await post(base, { slug: SLUG, subject: SUBJECT, action: "unlike" });
  assert.deepEqual(r.body, { likes: 1, liked: false });
  const dump = store.dump();
  assert.equal(dump.events.length, 3);
  assert.deepEqual(
    dump.events.map((e) => e.action),
    ["like", "like", "unlike"],
  );

  const counts = await (await fetch(`${base}/api/social/counts`)).json();
  assert.deepEqual(counts, { likes: { [SLUG]: 1 }, comments: {} });
});

test("validation: unknown slug, bad subject, bad action, bad JSON", async () => {
  const base = await start(createApp(new MemoryStore()));
  const cases = [
    [{ slug: "not-a-real-post", subject: SUBJECT, action: "like" }, "unknown_slug"],
    [{ slug: SLUG, subject: "d_nope", action: "like" }, "bad_subject"],
    [{ slug: SLUG, subject: SUBJECT, action: "boost" }, "bad_request"],
    ["{not json", "bad_request"],
  ];
  for (const [body, error] of cases) {
    const r = await post(base, body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.equal(r.body.error, error);
  }
  const missing = await fetch(`${base}/api/nope`);
  assert.equal(missing.status, 404);
});

test("per-subject rate limit answers 429", async () => {
  const base = await start(
    createApp(new MemoryStore(), {
      limits: { perSubject: 3, perClient: 100, global: 100 },
    }),
  );
  const toggle = ["like", "unlike"];
  for (let i = 0; i < 3; i++) {
    const r = await post(base, { slug: SLUG, subject: SUBJECT, action: toggle[i % 2] });
    assert.equal(r.status, 200);
  }
  const r = await post(base, { slug: SLUG, subject: SUBJECT, action: "unlike" });
  assert.equal(r.status, 429);
  assert.equal(r.body.error, "rate_limited");
});

test("per-client limit keys on the infra-appended XFF tail, not the left", async () => {
  const base = await start(
    createApp(new MemoryStore(), {
      limits: { perSubject: 100, perClient: 2, global: 100 },
    }),
  );
  const subjects = [
    "d_11111111-1111-4111-8111-111111111111",
    "d_22222222-2222-4222-8222-222222222222",
    "d_33333333-3333-4333-8333-333333333333",
  ];
  // Rotating the left (client-controlled) side must NOT reset the limit.
  for (let i = 0; i < 3; i++) {
    const r = await post(
      base,
      { slug: SLUG, subject: subjects[i], action: "like" },
      { "x-forwarded-for": `10.0.0.${i}, 198.51.100.7, 172.16.0.1` },
    );
    assert.equal(r.status, i < 2 ? 200 : 429);
  }
  // A different infra tail is a different caller and passes.
  const other = await post(
    base,
    { slug: SLUG, subject: subjects[0], action: "unlike" },
    { "x-forwarded-for": "10.0.0.9, 203.0.113.4, 172.16.0.1" },
  );
  assert.equal(other.status, 200);
});

test("global write ceiling bounds rotating subjects and clients", async () => {
  const base = await start(
    createApp(new MemoryStore(), {
      limits: { perSubject: 100, perClient: 100, global: 3 },
    }),
  );
  const mk = (i) => `d_${i}${i}${i}${i}${i}${i}${i}${i}-${i}${i}${i}${i}-4${i}${i}${i}-8${i}${i}${i}-${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}`;
  for (let i = 0; i < 4; i++) {
    const r = await post(
      base,
      { slug: SLUG, subject: mk(i), action: "like" },
      { "x-forwarded-for": `203.0.113.${i}` },
    );
    assert.equal(r.status, i < 3 ? 200 : 429, `request ${i}`);
  }
});

test("clientKey uses the two rightmost XFF entries", () => {
  const fake = (xff, remote = "9.9.9.9") => ({
    get: (h) => (h.toLowerCase() === "x-forwarded-for" ? xff : undefined),
    socket: { remoteAddress: remote },
  });
  assert.equal(clientKey(fake(undefined)), "9.9.9.9");
  assert.equal(clientKey(fake("1.2.3.4")), "1.2.3.4");
  assert.equal(
    clientKey(fake("spoofA, spoofB, 198.51.100.7, 172.16.0.1")),
    "198.51.100.7,172.16.0.1",
  );
  // Left-side rotation cannot change the key.
  assert.equal(
    clientKey(fake("other, 198.51.100.7, 172.16.0.1")),
    clientKey(fake("spoofA, spoofB, 198.51.100.7, 172.16.0.1")),
  );
});

test("host guard: forwarded host must be the site", async () => {
  const base = await start(createApp(new MemoryStore(), { enforceHost: true }));
  const denied = await post(
    base,
    { slug: SLUG, subject: SUBJECT, action: "like" },
    { "x-forwarded-host": "evil.example" },
  );
  assert.equal(denied.status, 403);
  const allowed = await post(
    base,
    { slug: SLUG, subject: SUBJECT, action: "like" },
    { "x-forwarded-host": "dbln.me" },
  );
  assert.equal(allowed.status, 200);

  assert.equal(hostAllowed("dbln.me"), true);
  assert.equal(hostAllowed("www.dbln.me:443"), true);
  assert.equal(hostAllowed("dbln-b56ec--pr9-abc12345.web.app"), true);
  assert.equal(hostAllowed("dbln-b56ec.firebaseapp.com"), true);
  assert.equal(hostAllowed("evil-dbln.me"), false);
  assert.equal(hostAllowed("dbln-b56ec.evil.app"), false);
  assert.equal(hostAllowed(undefined), false);
});

test("rate limiter window slides", () => {
  let t = 0;
  const w = new SlidingWindow(2, 1000, () => t);
  assert.equal(w.hit("k"), true);
  assert.equal(w.hit("k"), true);
  assert.equal(w.hit("k"), false);
  t = 1001;
  assert.equal(w.hit("k"), true);
});
