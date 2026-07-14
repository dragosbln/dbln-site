"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Post } from "@/content/types";
import { formatMonthYear } from "@/lib/format";
import styles from "./PostList.module.css";

type SortMode = "new" | "old" | "short" | "long";

type PostListProps = {
  posts: Post[];
};

/**
 * Tag-filterable, sortable post list. The full list is prerendered at build
 * (client components render to HTML too), so crawlers always see every post;
 * JS only adds filtering. `?tag=x` deep links are honored on mount.
 */
export default function PostList({ posts }: PostListProps) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("new");

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [posts]);

  // ?tag= deep links are applied after mount on purpose: reading the URL
  // during render would make the server-prerendered HTML (no query string at
  // build time) mismatch the first client render. One extra render on the
  // rare deep-link visit is the acceptable cost.
  useEffect(() => {
    const tag = new URLSearchParams(window.location.search).get("tag");
    if (tag && posts.some((p) => p.tags.includes(tag))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
      setActiveTags(new Set([tag]));
    }
  }, [posts]);

  // Keep the URL shareable when exactly one tag is selected.
  useEffect(() => {
    const query =
      activeTags.size === 1 ? `?tag=${encodeURIComponent([...activeTags][0])}` : "";
    window.history.replaceState(null, "", window.location.pathname + query);
  }, [activeTags]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const shown = useMemo(() => {
    const list = posts.filter(
      (post) =>
        activeTags.size === 0 || post.tags.some((tag) => activeTags.has(tag)),
    );
    const byDateDesc = (a: Post, b: Post) => b.date.localeCompare(a.date);
    if (sortMode === "new") list.sort(byDateDesc);
    if (sortMode === "old") list.sort((a, b) => byDateDesc(b, a));
    if (sortMode === "short")
      list.sort((a, b) => a.readTime - b.readTime || byDateDesc(a, b));
    if (sortMode === "long")
      list.sort((a, b) => b.readTime - a.readTime || byDateDesc(a, b));
    return list;
  }, [posts, activeTags, sortMode]);

  const selection =
    activeTags.size > 0 ? `#${[...activeTags].join(" · #")}` : "All articles";

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.controlsIn}>
          <div className={styles.tagbar}>
            <button
              type="button"
              className={activeTags.size === 0 ? `${styles.chip} ${styles.on}` : styles.chip}
              onClick={() => setActiveTags(new Set())}
            >
              All <span className={styles.count}>{posts.length}</span>
            </button>
            {tagCounts.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={activeTags.has(tag) ? `${styles.chip} ${styles.on}` : styles.chip}
                aria-pressed={activeTags.has(tag)}
                onClick={() => toggleTag(tag)}
              >
                #{tag} <span className={styles.count}>{count}</span>
              </button>
            ))}
          </div>
          <div className={styles.sort}>
            <label htmlFor="post-sort">Sort</label>
            <select
              id="post-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
              <option value="short">Shortest read</option>
              <option value="long">Longest read</option>
            </select>
          </div>
        </div>
      </div>
      <div className={styles.posts}>
        <div className="wrap">
          <p className={styles.countLine}>
            {shown.length} {shown.length === 1 ? "article" : "articles"} — {selection}
          </p>
          {shown.length === 0 ? (
            <p className={styles.empty}>No articles with that combination of tags.</p>
          ) : (
            <ul className={styles.list}>
              {shown.map((post) => (
                <li key={post.slug}>
                  <Link className={styles.row} href={`/blog/${post.slug}`}>
                    <div className={styles.lead}>
                      <span className={styles.coverBox}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- static export serves the SVG as-is */}
                        <img src={post.cover} alt={post.coverAlt} loading="lazy" />
                      </span>
                      <span className={styles.meta}>
                        <time dateTime={post.date}>{formatMonthYear(post.date)}</time>
                        <span className={styles.rt}>{post.readTime} min read</span>
                      </span>
                    </div>
                    <div>
                      <h2 className={styles.rowTitle}>{post.title}</h2>
                      <p className={styles.excerpt}>{post.excerpt}</p>
                      <ul className={styles.tags} aria-label="Topics">
                        {post.tags.map((tag) => (
                          <li key={tag}>#{tag}</li>
                        ))}
                      </ul>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
