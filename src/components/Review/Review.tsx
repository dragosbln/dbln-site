import ArrowIcon from "@/components/ArrowIcon";
import HashLink from "@/components/HashLink";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { review } from "@/content/site";
import styles from "./Review.module.css";

/**
 * Landing section 01: the engagement panel (three steps on one rail, the
 * scope line at its end) beside the contexts the review is read in. Both
 * columns come from `review` in site.ts; the context hrefs render through
 * `HashLink`, so an entry may point at a page or at the booking section.
 */
export default function Review() {
  const { panel, context } = review;
  return (
    <section
      id="review"
      className={`section ${styles.section}`}
      aria-labelledby="review-title"
    >
      <div className="wrap">
        <SectionHead
          num={review.num}
          title={review.title}
          id="review-title"
          className={styles.head}
        />
        <div className={styles.grid}>
          <Reveal className={styles.cell}>
            <div
              className={styles.panel}
              role="group"
              aria-labelledby="engagement-title"
            >
              <p className={styles.panelTitle} id="engagement-title">
                {panel.title}
              </p>
              <ol className={styles.steps}>
                <li className={styles.step}>
                  <p className={styles.label}>{panel.bring.label}</p>
                  <p className={styles.content}>{panel.bring.text}</p>
                </li>
                <li className={styles.step}>
                  <p className={styles.label}>{panel.lenses.label}</p>
                  <div className={styles.lenses}>
                    {panel.lenses.items.map((lens) => (
                      <p key={lens}>{lens}</p>
                    ))}
                  </div>
                </li>
                <li className={styles.step}>
                  <p className={styles.label}>{panel.receive.label}</p>
                  <ul
                    className={styles.handover}
                    aria-label={panel.receive.listLabel}
                  >
                    {panel.receive.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              </ol>
              <p className={styles.duration}>
                <span>{panel.scope} ·</span> <span>{panel.duration}</span>
              </p>
            </div>
          </Reveal>
          <Reveal className={styles.cell}>
            <nav className={styles.context} aria-labelledby="context-title">
              <p className={styles.label} id="context-title">
                {context.label}
              </p>
              <ul className={styles.contextList}>
                {context.items.map((item) => (
                  <li key={item.name}>
                    <HashLink
                      className={styles.contextLink}
                      href={item.href}
                      aria-label={item.ariaLabel}
                    >
                      <span className={styles.contextName}>{item.name}</span>
                      <span className={styles.arrow}>
                        <ArrowIcon size={15} />
                      </span>
                      <span className={styles.contextDesc}>{item.desc}</span>
                    </HashLink>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
