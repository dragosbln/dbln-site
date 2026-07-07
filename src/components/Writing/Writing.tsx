import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { writing } from "@/content/site";
import { formatMonthYear } from "@/lib/format";
import styles from "./Writing.module.css";

// TODO(blog): when /blog ships, wrap each card in a <Link href={`/blog/${slug}`}>
// and add the "Read article" row (see claude_websie/directions/brief.html).
// Cards are deliberately not links until the routes exist.
export default function Writing() {
  return (
    <section id="writing" className="section" aria-labelledby="writing-title">
      <div className="wrap">
        <SectionHead
          num={writing.num}
          title={writing.title}
          id="writing-title"
          aside={writing.aside}
        />
        <ul className={styles.grid}>
          {writing.articles.map((article) => (
            <Reveal as="li" className={styles.cell} key={article.slug}>
              <article className={styles.card}>
                <p className={styles.meta}>
                  <time dateTime={article.date}>
                    {formatMonthYear(article.date)}
                  </time>
                  <span>{article.readTime} min</span>
                </p>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <ul className={styles.tags} aria-label="Topics">
                  {article.tags.map((tag) => (
                    <li key={tag}>#{tag}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
