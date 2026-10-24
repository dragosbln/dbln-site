import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, reviewer } from "@/content/review";
import { site, testimonials } from "@/content/site";
import type { NavItem } from "@/content/types";
import { hrefKind } from "@/lib/hrefKind";
import ReviewSlider from "./ReviewSlider";
import styles from "./Reviewer.module.css";

/** A link of the presentation card: pages of this site, or a profile in a new tab. */
function ProfileLink({ item }: { item: NavItem }) {
  switch (hrefKind(item.href)) {
    case "internal":
      return (
        <Link className={styles.link} href={item.href}>
          {item.label}
        </Link>
      );
    case "external":
      return (
        <a
          className={styles.link}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.label}
        </a>
      );
    case "mailto":
      return (
        <a className={styles.link} href={item.href}>
          {item.label}
        </a>
      );
  }
}

/** 04 · Who runs it: the presentation card beside the testimonial slider. */
export default function Reviewer() {
  return (
    <section
      id={anchors.reviewer}
      className="section"
      aria-labelledby="who-runs-it-title"
    >
      <div className="wrap">
        <SectionHead
          num={reviewer.num}
          title={reviewer.title}
          id="who-runs-it-title"
          className={styles.head}
        />
        <Reveal className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.row}>
              <div className={styles.identity}>
                <figure className={styles.photo}>
                  <Image
                    src={reviewer.portrait.src}
                    alt={reviewer.portrait.alt}
                    width={150}
                    height={150}
                    sizes="150px"
                  />
                </figure>
                <p className={styles.name}>{site.name}</p>
                <p className={styles.location}>
                  {reviewer.location.map((line, index) => (
                    <Fragment key={line}>
                      {index > 0 ? <br /> : null}
                      {line}
                    </Fragment>
                  ))}
                </p>
                <ul className={styles.links}>
                  {reviewer.links.map((row) => (
                    <li key={row.map((item) => item.href).join(" ")}>
                      {row.map((item, index) => (
                        <Fragment key={item.href}>
                          {index > 0 ? (
                            <span className={styles.sep} aria-hidden="true">
                              ·
                            </span>
                          ) : null}
                          <ProfileLink item={item} />
                        </Fragment>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {reviewer.bio.map((paragraph) => (
                  <p key={paragraph} className={styles.bio}>
                    {paragraph}
                  </p>
                ))}
                <div className={styles.depth}>
                  <p className={`${styles.label} ${styles.depthLabel}`}>
                    {reviewer.depthLabel}
                  </p>
                  <ul className={styles.chips} aria-label={reviewer.depthLabel}>
                    {reviewer.depth.map((item) => (
                      <li key={item} className={styles.chip}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <ReviewSlider items={testimonials.items} copy={reviewer.slider} />
        </Reveal>
      </div>
    </section>
  );
}
