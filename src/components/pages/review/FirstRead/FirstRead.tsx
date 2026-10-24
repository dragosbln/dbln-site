import Link from "next/link";
import PillLink from "@/components/PillLink";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, firstRead } from "@/content/review";
import { site } from "@/content/site";
import { mailtoHref } from "@/lib/mailto";
import { richText } from "@/lib/richText";
import styles from "./FirstRead.module.css";

/** 05 · Start with a first read: the three ways in, beside the mailto panel. */
export default function FirstRead() {
  return (
    <section
      id={anchors.firstRead}
      className="section"
      aria-labelledby="first-read-title"
    >
      <div className="wrap">
        <SectionHead
          num={firstRead.num}
          title={firstRead.title}
          id="first-read-title"
          aside={firstRead.aside}
          asideLink={firstRead.asideLink}
          asideTail={firstRead.asideTail}
          asideOnPhone
          className={styles.head}
        />
        <Reveal className={styles.grid}>
          <div>
            <p className={styles.lede}>{firstRead.lede}</p>
            <p className={`${styles.label} ${styles.waysLabel}`}>
              {firstRead.waysLabel}
            </p>
            <ol className={styles.ways}>
              {firstRead.ways.map((way) => (
                <li key={way.letter} className={styles.way}>
                  <span className={styles.letter}>{way.letter}</span>
                  <p className={styles.body}>{richText(way.body)}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.panel}>
            <PillLink
              block
              className={styles.cta}
              href={mailtoHref(site.email, firstRead.cta)}
            >
              {firstRead.cta.label}
            </PillLink>
            {firstRead.guide ? (
              <p className={styles.guide}>
                <Link className={styles.link} href={firstRead.guide.href}>
                  {firstRead.guide.label}
                </Link>
              </p>
            ) : null}
            <p className={`${styles.label} ${styles.notLabel}`}>
              {firstRead.notLabel}
            </p>
            <p className={styles.not}>{firstRead.not}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
