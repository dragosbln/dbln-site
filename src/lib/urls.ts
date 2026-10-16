import { site } from "@/content/site";

/**
 * The one true spelling of post URLs. Every surface that links an article —
 * pages, sitemap, feed, llms.txt, JSON-LD, og tags — builds through these,
 * so the path scheme can never drift between them. No node imports: client
 * components use these too.
 */

/** Site-relative article path: "/blog/<slug>". */
export function postPath(slug: string): string {
  return `/blog/${slug}`;
}

/** Absolute article URL for SEO surfaces (sitemap, feed, JSON-LD, og). */
export function postUrl(slug: string): string {
  return `${site.url}${postPath(slug)}`;
}

/**
 * The committed PNG twin of an SVG cover (scripts/render-cover-png.mts) —
 * link scrapers don't render SVG, so og:image points here.
 */
export function coverOgImage(cover: string): string {
  return cover.replace(/\.svg$/, ".png");
}

/**
 * The site-wide social image: the home page and every page without a cover
 * of its own (/blog, /work, /privacy). PNG twin of covers/site.svg (edit the
 * SVG, then `node scripts/render-cover-png.mts site`). Pages that export
 * their own `openGraph` replace the layout's wholesale, so they must list
 * this themselves or they ship no image at all — X then shows no card.
 */
export const siteOgImage = {
  url: "/blog/covers/site.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — Independent AI Reliability Reviews`,
};
