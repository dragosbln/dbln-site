import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import PostList from "@/components/PostList";
import { blogHero } from "@/content/blog";
import { site } from "@/content/site";
import { getPosts } from "@/lib/posts";
import { blogBreadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Writing",
  description: blogHero.metaDescription,
  alternates: {
    canonical: "/blog",
  },
  // Set per page: openGraph merges shallowly with the layout, which would
  // otherwise leave this page sharing the homepage's og:url and og:title.
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: site.name,
    locale: "en_US",
    title: "Writing",
    description: blogHero.metaDescription,
  },
};

export default function BlogPage() {
  return (
    <main id="main">
      <PageHero content={blogHero} />
      <PostList posts={getPosts()} />
      <JsonLd data={blogBreadcrumbSchema} />
    </main>
  );
}
