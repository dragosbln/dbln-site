import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, reviewer } from "@/content/customerOperations";
import { site } from "@/content/site";
import type { NavItem } from "@/content/types";
import { hrefKind } from "@/lib/hrefKind";
import styles from "./Who.module.css";

/** A profile-card link: a page of this site, or a profile in a new tab. */
function ProfileLink({ item }: { item: NavItem }) {
  if (hrefKind(item.href) === "internal") {
    return <Link href={item.href}>{item.label}</Link>;
  }
  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer">
      {item.label}
    </a>
  );
}

/**
 * 04 · Who runs it (design: R3 in the customer-operations reference): the
 * profile card beside one testimonial, then two selected articles under a
 * hairline.
 */
export default function Who() {
  const titleId = `${anchors.reviewer}-title`;
  const { testimonial, writing } = reviewer;
  return (
    <section
      id={anchors.reviewer}
      className={`section ${styles.section}`}
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={reviewer.num}
          title={reviewer.title}
          id={titleId}
          className={styles.head}
        />
        <Reveal className={styles.top}>
          <div className={styles.profile}>
            <div className={styles.identity}>
              <Image
                className={styles.photo}
                src={site.portrait}
                alt={site.name}
                width={78}
                height={78}
                sizes="78px"
              />
              <div>
                <h3 className={styles.name}>{site.name}</h3>
                <p className={styles.role}>{reviewer.role}</p>
                <p className={styles.location}>{reviewer.location}</p>
              </div>
            </div>
            {reviewer.bio.map((paragraph) => (
              <p key={paragraph} className={styles.bio}>
                {paragraph}
              </p>
            ))}
            <p className={styles.commitment}>{reviewer.commitment}</p>
            <div className={styles.links}>
              {reviewer.links.map((item) => (
                <ProfileLink key={item.href} item={item} />
              ))}
            </div>
          </div>
          <figure className={styles.testimonial}>
            <p className={styles.label}>{testimonial.label}</p>
            <blockquote className={styles.quote}>“{testimonial.quote}”</blockquote>
            <figcaption className={styles.citation}>
              {testimonial.href ? (
                <a href={testimonial.href} target="_blank" rel="noopener noreferrer">
                  {testimonial.name}
                </a>
              ) : (
                testimonial.name
              )}
              <span>{testimonial.role}</span>
            </figcaption>
          </figure>
        </Reveal>
        <Reveal className={styles.writing}>
          <div className={styles.writingHead}>
            <h3 className={styles.label}>{writing.label}</h3>
            <Link className={styles.all} href={writing.all.href}>
              {writing.all.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.pair}>
            {writing.articles.map((article) => (
              <Link key={article.href} className={styles.article} href={article.href}>
                <span className={styles.articleTitle}>{article.title}</span>
                <span className={styles.articleDesc}>{article.desc}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
