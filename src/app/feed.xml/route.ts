import { blogHero } from "@/content/blog";
import { site } from "@/content/site";
import { getPosts } from "@/lib/posts";
import { postUrl } from "@/lib/urls";

// Emitted as a static /feed.xml at build time. Advertised site-wide via the
// RSS <link rel="alternate"> in the root layout metadata.
export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pubDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export function GET() {
  const posts = getPosts();
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl(post.slug)}</link>
      <guid>${postUrl(post.slug)}</guid>
      <pubDate>${pubDate(post.date)}</pubDate>
      <dc:creator>${escapeXml(site.name)}</dc:creator>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`,
    )
    .join("\n");

  // lastBuildDate is the newest post's date, not the build clock — a fresh
  // deploy without new writing must not signal feed readers to refetch.
  const lastBuild = posts[0] ? `\n    <lastBuildDate>${pubDate(posts[0].date)}</lastBuildDate>` : "";

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(site.name)} — Writing</title>
    <link>${site.url}/blog</link>
    <description>${escapeXml(blogHero.metaDescription)}</description>
    <language>en</language>${lastBuild}
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
