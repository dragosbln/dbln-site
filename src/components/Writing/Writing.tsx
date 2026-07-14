import Link from "next/link";
import ArrowIcon from "@/components/ArrowIcon";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { writing } from "@/content/site";
import { formatMonthYear } from "@/lib/format";
import { getPosts } from "@/lib/posts";
import styles from "./Writing.module.css";

export default function Writing() {
  const posts = getPosts().slice(0, writing.featuredCount);
  return (
    <section id="writing" className="section" aria-labelledby="writing-title">
      <div className="wrap">
        <SectionHead
          num={writing.num}
          title={writing.title}
          id="writing-title"
          aside={writing.aside}
          asideLink={writing.asideLink}
        />
        <ul className={styles.grid}>
          {posts.map((post) => (
            <Reveal as="li" className={styles.cell} key={post.slug}>
              <Link className={styles.card} href={`/blog/${post.slug}`}>
                <span className={styles.meta}>
                  <time dateTime={post.date}>{formatMonthYear(post.date)}</time>
                  <span>{post.readTime} min</span>
                </span>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                <ul className={styles.tags} aria-label="Topics">
                  {post.tags.map((tag) => (
                    <li key={tag}>#{tag}</li>
                  ))}
                </ul>
                <span className={styles.go}>
                  Read article <ArrowIcon size={12} />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
