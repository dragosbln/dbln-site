// Content-contract tests: the publishing invariants AGENTS.md describes but
// nothing else enforces. Run with `npm test`. Dependency-light on purpose —
// reads the files directly rather than importing the app's TS modules.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import matter from "gray-matter";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");
const PUBLIC = path.join(ROOT, "public");
const SLUG_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const slugs = new Set(files.map((f) => f.replace(/\.md$/, "")));

test("there is at least one post", () => {
  assert.ok(files.length > 0, "no posts found in src/content/posts");
});

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const { data, content } = matter(readFileSync(path.join(POSTS_DIR, file), "utf8"));

  test(`${file}: slug is url-safe`, () => {
    assert.match(slug, SLUG_RE, `slug "${slug}" must be [a-z0-9-]`);
  });

  test(`${file}: required frontmatter is present and well-typed`, () => {
    for (const field of ["title", "excerpt", "cover", "coverAlt"]) {
      assert.equal(
        typeof data[field] === "string" && data[field].trim() !== "",
        true,
        `"${field}" must be a non-empty string`,
      );
    }
    assert.equal(
      typeof data.date === "string" && DATE_RE.test(data.date),
      true,
      `"date" must be a quoted YYYY-MM-DD string (got ${JSON.stringify(data.date)})`,
    );
    if (data.updated !== undefined) {
      assert.match(String(data.updated), DATE_RE, `"updated" must be YYYY-MM-DD`);
    }
    assert.ok(Array.isArray(data.tags ?? []), `"tags" must be an array`);
    for (const t of data.tags ?? []) {
      assert.equal(typeof t, "string", `each tag must be a string`);
    }
    if (data.devto !== undefined) {
      assert.equal(typeof data.devto, "string", `"devto" must be a string`);
    }
  });

  test(`${file}: cover SVG and its PNG twin exist`, () => {
    const svg = path.join(PUBLIC, data.cover);
    assert.ok(existsSync(svg), `cover missing: public${data.cover}`);
    const png = data.cover.replace(/\.svg$/, ".png");
    assert.ok(existsSync(path.join(PUBLIC, png)), `og:image PNG twin missing: public${png} (run scripts/render-cover-png.mts)`);
  });

  test(`${file}: body has no h1 (frontmatter title is the h1)`, () => {
    let inFence = false;
    let h1;
    for (const line of content.split("\n")) {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      else if (!inFence && /^#\s/.test(line)) {
        h1 = line;
        break;
      }
    }
    assert.equal(h1, undefined, `body must start sections at "##", found "${h1}"`);
  });

  test(`${file}: body links to no dev.to URLs (this site is canonical)`, () => {
    assert.equal(
      /\]\(https?:\/\/(www\.)?dev\.to/.test(content),
      false,
      "cross-link articles with /blog/<slug>, not dev.to URLs",
    );
  });

  test(`${file}: local image paths resolve to files in public/`, () => {
    for (const m of content.matchAll(/!\[[^\]]*\]\((\/blog\/[^)]+)\)/g)) {
      const rel = m[1].split(/[?#]/)[0];
      assert.ok(existsSync(path.join(PUBLIC, rel)), `image not found: public${rel}`);
    }
  });

  test(`${file}: internal /blog links resolve to real posts`, () => {
    for (const m of content.matchAll(/\]\((\/blog\/[a-z0-9-]+)(#[^)]*)?\)/g)) {
      const target = m[1].replace(/^\/blog\//, "");
      // skip if it points at an image path (handled above) — those have extensions
      if (/\.[a-z]+$/.test(target)) continue;
      assert.ok(slugs.has(target), `internal link /blog/${target} has no matching post`);
    }
  });
}
