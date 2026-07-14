import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getPosts } from "@/lib/posts";
import { postUrl } from "@/lib/urls";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  // Content-derived only — a build-time `new Date()` would claim the page
  // changed on every deploy and teach crawlers to ignore lastmod site-wide.
  const newestPost = posts[0]?.date;
  return [
    {
      url: site.url,
      // the landing page's Writing cards change with the newest post
      ...(newestPost ? { lastModified: new Date(newestPost) } : {}),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/work`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/blog`,
      ...(newestPost ? { lastModified: new Date(newestPost) } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: postUrl(post.slug),
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
