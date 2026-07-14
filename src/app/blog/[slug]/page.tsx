import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@/components/ArticleView";
import JsonLd from "@/components/JsonLd";
import { site } from "@/content/site";
import { markdownToHtml } from "@/lib/markdown";
import { getPost, getPosts } from "@/lib/posts";
import { postBreadcrumbSchema, techArticleSchema } from "@/lib/schema";
import { coverOgImage, postPath } from "@/lib/urls";

type ArticleParams = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: ArticleParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  // og:image must be the PNG twin (scripts/render-cover-png.mts): the major
  // link scrapers do not render SVG covers.
  const ogImage = {
    url: coverOgImage(post.cover),
    width: 1200,
    height: 630,
    alt: post.coverAlt,
  };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: postPath(post.slug),
    },
    // A page-level openGraph replaces the layout's wholesale (shallow merge),
    // so siteName and locale are restated here.
    openGraph: {
      type: "article",
      url: postPath(post.slug),
      siteName: site.name,
      locale: "en_US",
      title: post.title,
      description: post.excerpt,
      publishedTime: `${post.date}T00:00:00.000Z`,
      modifiedTime: `${post.updated ?? post.date}T00:00:00.000Z`,
      authors: [site.url],
      tags: post.tags,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage.url],
    },
  };
}

export default async function ArticlePage({ params }: ArticleParams) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await markdownToHtml(post.body);
  const related = getPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <main id="main">
      <ArticleView post={post} html={html} related={related} />
      <JsonLd data={techArticleSchema(post)} />
      <JsonLd data={postBreadcrumbSchema(post)} />
    </main>
  );
}
