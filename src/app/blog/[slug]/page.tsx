import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@/components/ArticleView";
import JsonLd from "@/components/JsonLd";
import { markdownToHtml } from "@/lib/markdown";
import { getPost, getPosts } from "@/lib/posts";
import { postBreadcrumbSchema, techArticleSchema } from "@/lib/schema";

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
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      tags: post.tags,
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
