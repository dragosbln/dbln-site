/**
 * Slug catalog: articles published after the backend deploy are learned
 * from the live sitemap, with bounded fetching. Plus the app-level effect:
 * a post-deploy article gets a working Discussion (token, post, like).
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const require = createRequire(import.meta.url);
const { slugCatalog } = require("../lib/slugCatalog.js");
const { createApp } = require("../lib/app.js");
const { MemoryStore } = require("../lib/store.js");
const { mintToken, TOKEN_MIN_AGE_MS } = require("../lib/token.js");

const SITEMAP = "https://dbln.me/sitemap.xml";
const xml = (...slugs) =>
  "<urlset>" +
  "<url><loc>https://dbln.me</loc></url>" +
  "<url><loc>https://dbln.me/blog</loc></url>" +
  slugs.map((s) => `<url><loc>https://dbln.me/blog/${s}</loc></url>`).join("") +
  "<url><loc>https://elsewhere.example/blog/foreign-post</loc></url>" +
  "</urlset>";

function fakeFetch(body) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    if (body instanceof Error) throw body;
    return typeof body === "function" ? body() : body;
  };
  return { fn, calls };
}

test("baked slugs pass without any fetch", async () => {
  const f = fakeFetch(xml());
  const exists = slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: ["old-post"] });
  assert.equal(await exists("old-post"), true);
  assert.equal(f.calls.length, 0);
});

test("a slug published after the deploy is learned from the sitemap, once", async () => {
  const f = fakeFetch(xml("old-post", "new-post"));
  const exists = slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: ["old-post"] });
  assert.equal(await exists("new-post"), true);
  assert.equal(await exists("new-post"), true);
  assert.deepEqual(f.calls, [SITEMAP]);
});

test("misses are throttled to one fetch per interval", async () => {
  let t = 1_000_000;
  const f = fakeFetch(xml());
  const exists = slugCatalog({
    sitemapUrl: SITEMAP,
    fetchText: f.fn,
    baked: [],
    minRefreshMs: 30_000,
    now: () => t,
  });
  assert.equal(await exists("nope-a"), false);
  assert.equal(await exists("nope-b"), false);
  assert.equal(f.calls.length, 1);
  t += 30_000;
  assert.equal(await exists("nope-c"), false);
  assert.equal(f.calls.length, 2);
});

test("concurrent misses share one in-flight fetch", async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  const f = fakeFetch(async () => {
    await gate;
    return xml("new-post");
  });
  const exists = slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: [] });
  const pending = [exists("new-post"), exists("new-post"), exists("other")];
  release();
  assert.deepEqual(await Promise.all(pending), [true, true, false]);
  assert.equal(f.calls.length, 1);
});

test("malformed slugs never trigger a fetch", async () => {
  const f = fakeFetch(xml());
  const exists = slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: [] });
  for (const bad of ["../etc", "Upper-Case", "", "a".repeat(121), "x y"]) {
    assert.equal(await exists(bad), false, bad);
  }
  assert.equal(f.calls.length, 0);
});

test("only this site's /blog/<slug> entries count", async () => {
  const f = fakeFetch(xml("real-post"));
  const exists = slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: [] });
  assert.equal(await exists("foreign-post"), false);
  assert.equal(await exists("real-post"), true);
  assert.equal(await exists("blog"), false);
});

test("a failed sitemap fetch fails closed", async () => {
  const f = fakeFetch(new Error("sitemap 503"));
  const exists = slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: [] });
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal(await exists("new-post"), false);
  } finally {
    console.error = originalError;
  }
});

test("without a sitemap URL the catalog is the baked list only", async () => {
  const f = fakeFetch(xml("new-post"));
  const exists = slugCatalog({ fetchText: f.fn, baked: ["old-post"] });
  assert.equal(await exists("new-post"), false);
  assert.equal(f.calls.length, 0);
});

// ---- app level ----
const servers = [];
after(() => servers.forEach((s) => s.close()));
function start(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

test("a post-deploy article gets a working Discussion and like button", async () => {
  const f = fakeFetch(xml("new-post"));
  const store = new MemoryStore();
  const base = await start(
    createApp(store, {
      tokenKey: "k",
      limits: { commentCooldownMs: 0 },
      slugExists: slugCatalog({ sitemapUrl: SITEMAP, fetchText: f.fn, baked: [] }),
    }),
  );

  const res = await fetch(`${base}/api/comments?slug=new-post`);
  assert.equal(res.status, 200);
  assert.equal(typeof (await res.json()).token, "string");

  // A ripe token, as the comment tests mint it.
  const token = mintToken("k", Date.now() - TOKEN_MIN_AGE_MS - 500);
  const post = await fetch(`${base}/api/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: "new-post",
      subject: "d_2c8f7a1e-0b3d-4e5f-9a6b-7c8d9e0f1a2b",
      name: "Reader",
      body: "Follow-up: [Five ground rules](https://dbln.me/blog/new-post)",
      token,
    }),
  });
  assert.equal(post.status, 200);

  const like = await fetch(`${base}/api/likes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: "new-post",
      subject: "d_2c8f7a1e-0b3d-4e5f-9a6b-7c8d9e0f1a2b",
      action: "like",
    }),
  });
  assert.equal(like.status, 200);

  const unknown = await fetch(`${base}/api/comments?slug=never-published`);
  assert.equal(unknown.status, 400);
  assert.equal(f.calls.length, 1, "the later miss is inside the refresh interval");
});
