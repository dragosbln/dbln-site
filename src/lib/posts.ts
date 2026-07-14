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

function readTimeOf(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function parseFile(filename: string): { post: Post; body: string } {
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    post: {
      slug: filename.replace(/\.md$/, ""),
      title: data.title,
      date: data.date,
      readTime: readTimeOf(content),
      tags: data.tags ?? [],
      excerpt: data.excerpt,
      cover: data.cover,
      coverAlt: data.coverAlt,
      devto: data.devto,
    },
    body: content,
  };
}

/** All posts, newest first. */
export function getPosts(): Post[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseFile(f).post)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): PostWithBody | undefined {
  if (!fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) return undefined;
  const { post, body } = parseFile(`${slug}.md`);
  return { ...post, body };
}
