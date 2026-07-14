import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post, PostWithBody } from "@/content/types";

/**
 * Filesystem-backed post access, build-time only (static export prerenders
 * everything). Publishing an article = dropping a .md with frontmatter into
 * src/content/posts — pages, sitemap, feed, llms.txt and the landing cards
 * all read from here.
 */

const POSTS_DIR = path.join(process.cwd(), "src", "content", "posts");
const WORDS_PER_MINUTE = 220;
const SLUG_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readTimeOf(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Frontmatter is authored by hand; every mistake must fail the build with a
 * message that names the file and field. Without this, an unquoted YAML date
 * (parsed to a Date object) crashes the post sort three files away, and a
 * missing excerpt/cover ships "undefined" into the feed and JSON-LD.
 */
function requireString(
  data: Record<string, unknown>,
  field: string,
  filename: string,
): string {
  const value = data[field];
  if (typeof value !== "string" || value.trim() === "") {
    const hint =
      value instanceof Date
        ? " (quote the value — YAML parses bare dates as Date objects)"
        : "";
    throw new Error(
      `posts: ${filename} frontmatter "${field}" must be a non-empty string${hint}`,
    );
  }
  return value;
}

function parseFile(filename: string): { post: Post; body: string } {
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  const date = requireString(data, "date", filename);
  if (!DATE_RE.test(date)) {
    throw new Error(
      `posts: ${filename} frontmatter "date" must be YYYY-MM-DD, got "${date}"`,
    );
  }
  const tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
    throw new Error(`posts: ${filename} frontmatter "tags" must be a string array`);
  }
  if (data.devto !== undefined && typeof data.devto !== "string") {
    throw new Error(`posts: ${filename} frontmatter "devto" must be a string`);
  }
  if (data.updated !== undefined) {
    if (typeof data.updated !== "string" || !DATE_RE.test(data.updated)) {
      throw new Error(
        `posts: ${filename} frontmatter "updated" must be YYYY-MM-DD (quoted)`,
      );
    }
  }

  return {
    post: {
      slug: filename.replace(/\.md$/, ""),
      title: requireString(data, "title", filename),
      date,
      readTime: readTimeOf(content),
      tags,
      excerpt: requireString(data, "excerpt", filename),
      cover: requireString(data, "cover", filename),
      coverAlt: requireString(data, "coverAlt", filename),
      updated: data.updated,
      devto: data.devto,
    },
    body: content,
  };
}

/** All posts, newest first (slug breaks date ties so builds are stable). */
export function getPosts(): Post[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseFile(f).post)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string): PostWithBody | undefined {
  // Only prebuilt slugs exist in the static export, but `next dev` routes any
  // request here: reject traversal shapes and case aliases before touching
  // the filesystem.
  if (!SLUG_RE.test(slug)) return undefined;
  if (!fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) return undefined;
  const { post, body } = parseFile(`${slug}.md`);
  return { ...post, body };
}
