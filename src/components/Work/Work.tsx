import Link from "next/link";
import ArrowIcon from "@/components/ArrowIcon";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { work } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./Work.module.css";

export default function Work() {
  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <div className="wrap">
        <SectionHead
          num={work.num}
          title={work.title}
          id="work-title"
          aside={work.aside}
          asideLink={work.asideLink}
        />
        <ul className={styles.list}>
          {work.items.map((item) => (
            <Reveal as="li" className={styles.row} key={item.title}>
              <span className={styles.period}>{item.period}</span>
              <div>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.role}>{item.role}</p>
              </div>
              <div className={styles.body}>
                <p>{richText(item.body)}</p>
                <ul className={styles.tags} aria-label="Focus areas">
                  {item.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
        {work.cta ? (
          <Link className={styles.allCta} href={work.cta.href}>
            {work.cta.label} <ArrowIcon />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
