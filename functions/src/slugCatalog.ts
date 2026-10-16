import { SLUGS } from "./slugs";

/**
 * Which article slugs the API accepts (likes and comments for anything
 * else are refused, so junk slugs can't create records).
 *
 * The build bakes in the posts that existed at deploy time (SLUGS). Hosting
 * deploys on every push but this backend only on a manual deploy, so an
 * article published after the last backend deploy used to get a dead
 * Discussion: GET /api/comments answered unknown_slug, no post token, a
 * disabled Post button. Now a slug outside the baked set is checked against
 * the live site's sitemap, the site's own list of published articles.
 *
 * Cost bounds: known slugs never trigger a fetch; a malformed slug never
 * does; and the sitemap is fetched at most once per `minRefreshMs` per
 * instance (concurrent misses share the one request), so a caller spraying
 * random slugs costs one small same-site fetch per interval, nothing more.
 * Slugs learned from the sitemap stay known for the instance's lifetime.
 */

const SLUG_RE = /^[a-z0-9-]{1,120}$/;

export type SlugCatalogOptions = {
  /** e.g. https://dbln.me/sitemap.xml. Absent = baked list only (dev, tests). */
  sitemapUrl?: string;
  /** Injected in tests; defaults to a 3-second-timeout fetch. */
  fetchText?: (url: string) => Promise<string>;
  /** Minimum gap between sitemap fetches. */
  minRefreshMs?: number;
  /** Clock, injected in tests. */
  now?: () => number;
  /** Starting set; defaults to the deploy-time SLUGS. */
  baked?: readonly string[];
};

async function defaultFetchText(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  return res.text();
}

export type SlugExists = (slug: string) => Promise<boolean>;

export function slugCatalog(opts: SlugCatalogOptions = {}): SlugExists {
  const known = new Set(opts.baked ?? SLUGS);
  const fetchText = opts.fetchText ?? defaultFetchText;
  const minRefreshMs = opts.minRefreshMs ?? 30_000;
  const now = opts.now ?? Date.now;
  let lastAttempt = -Infinity;
  let inflight: Promise<void> | null = null;

  // Article URLs only: <loc>https://dbln.me/blog/<slug></loc>. The /blog
  // index itself has no slug segment and doesn't match.
  const escapeRe = (s: string) => s.replace(/[.*+?^$()|[\]{}\\/]/g, "\\$&");
  const articleLoc = opts.sitemapUrl
    ? new RegExp(
        "<loc>" +
          escapeRe(new URL(opts.sitemapUrl).origin) +
          "\\/blog\\/([a-z0-9-]+)<\\/loc>",
        "g",
      )
    : null;

  const refresh = async () => {
    if (!opts.sitemapUrl || !articleLoc) return;
    try {
      const xml = await fetchText(opts.sitemapUrl);
      for (const m of xml.matchAll(articleLoc)) known.add(m[1]);
    } catch (err) {
      // Fail closed: the slug stays unknown until the next allowed refresh.
      console.error("[slugs] sitemap refresh failed:", err);
    }
  };

  return async (slug: string) => {
    if (known.has(slug)) return true;
    if (!opts.sitemapUrl || !SLUG_RE.test(slug)) return false;
    if (!inflight && now() - lastAttempt >= minRefreshMs) {
      lastAttempt = now();
      inflight = refresh().finally(() => {
        inflight = null;
      });
    }
    if (inflight) await inflight;
    return known.has(slug);
  };
}
