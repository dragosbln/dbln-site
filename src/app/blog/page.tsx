import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import PostList from "@/components/PostList";
import { blogHero } from "@/content/blog";
import { getPosts } from "@/lib/posts";
import { blogBreadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Architecture decisions, written up in full. Notes from production work: auth, system boundaries, cloud strategy and the agentic-era tradeoffs that come with them.",
  alternates: {
    canonical: "/blog",
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
