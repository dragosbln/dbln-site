import Link from "next/link";
import ArrowIcon from "@/components/ArrowIcon";
import ArticlePeek from "@/components/ArticlePeek";
import DiagramLightbox from "@/components/DiagramLightbox";
import HeadingAnchors from "@/components/HeadingAnchors";
import ShareButton from "@/components/ShareButton";
import type { Post, PostWithBody } from "@/content/types";
import { formatMonthYear } from "@/lib/format";
import { postPath } from "@/lib/urls";
import styles from "./ArticleView.module.css";

type ArticleViewProps = {
  post: PostWithBody;
  /** Markdown body rendered to HTML at build (src/lib/markdown.ts). */
  html: string;
  /** "Keep reading" suggestions. */
  related: Post[];
};

export default function ArticleView({ post, html, related }: ArticleViewProps) {
  return (
    <article className={styles.article}>
      <div className={styles.head}>
        <div className="wrap">
          <div className={styles.headIn}>
            <Link className={styles.crumb} href="/blog">
              <span aria-hidden="true">←</span> All articles
            </Link>
            <p className={styles.meta}>
              <time dateTime={post.date}>{formatMonthYear(post.date)}</time>
              <span className={styles.sep} aria-hidden="true" />
              <span>{post.readTime} min read</span>
            </p>
            <h1 className={styles.title}>{post.title}</h1>
            <ul className={styles.tags} aria-label="Topics">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link href={`/blog?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <figure className={styles.cover}>
        <div className="wrap">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export serves the SVG as-is */}
          <img src={post.cover} alt={post.coverAlt} />
        </div>
      </figure>
      <div className="wrap">
        <hr className={styles.rule} />
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        <HeadingAnchors />
        {html.includes("dg-figure") ? <DiagramLightbox /> : null}
        {html.includes('href="/blog/') ? <ArticlePeek /> : null}
        <div className={styles.engage}>
          <ShareButton />
        </div>
      </div>
      {related.length > 0 ? (
        <aside className={styles.next} aria-label="Keep reading">
          <div className="wrap">
            <p className={styles.nextHead}>Keep reading</p>
            <ul className={styles.nextGrid}>
              {related.map((p) => (
                <li key={p.slug}>
                  <Link className={styles.nextCard} href={postPath(p.slug)}>
                    <span className={styles.nextCover}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- static export serves the SVG as-is */}
                      <img src={p.cover} alt={p.coverAlt} loading="lazy" />
                    </span>
                    <span className={styles.nextBody}>
                      <span className={styles.nextMeta}>
                        {formatMonthYear(p.date)} · {p.readTime} min
                      </span>
                      <h2 className={styles.nextTitle}>{p.title}</h2>
                      <span className={styles.nextGo}>
                        Read article <ArrowIcon size={12} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}
    </article>
  );
}
