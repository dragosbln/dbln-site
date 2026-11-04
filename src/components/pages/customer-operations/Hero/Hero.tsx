import ArrowIcon from "@/components/ArrowIcon";
import HashLink from "@/components/HashLink";
import PillLink from "@/components/PillLink";
import { hero } from "@/content/customerOperations";
import { richText } from "@/lib/richText";
import styles from "./Hero.module.css";

/**
 * The page's hero: eyebrow, title, lede and two doors on the left, the
 * "at a glance" panel on the right (under the text below 980px). The
 * panel's three blocks sit on one teal rail that ends in a chevron over the
 * timeline. No Reveal, as on the other heroes: it is above the fold.
 */
export default function Hero() {
  const { doors, panel } = hero;
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className="wrap">
        <div className={styles.grid}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.label}>{hero.eyebrow}</span>
            </p>
            <h1 id="hero-title" className={styles.title}>
              {richText(hero.title)}
            </h1>
            <p className={styles.lede}>{hero.lede}</p>
            <div className={styles.doors}>
              <PillLink
                className={styles.primary}
                href={doors.primary.href}
                arrow
              >
                {doors.primary.label}
              </PillLink>
              <HashLink className={styles.ghost} href={doors.secondary.href}>
                {doors.secondary.label} <ArrowIcon size={13} />
              </HashLink>
            </div>
          </div>
          <div className={styles.panel} role="group" aria-label={panel.title}>
            <p className={styles.panelHead}>
              <span className={styles.panelTitle}>{panel.title}</span>
            </p>
            <div className={styles.body}>
              <span className={styles.rail} aria-hidden="true" />
              <svg
                className={styles.railEnd}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M6 10l6 6 6-6" />
              </svg>
              <div className={`${styles.block} ${styles.blockIn}`}>
                <span className={styles.blockDot} aria-hidden="true" />
                <p className={styles.blockLabel}>{panel.goesIn.label}</p>
                <ul className={styles.inList}>
                  {panel.goesIn.items.map((item) => (
                    <li key={item.title}>
                      <p className={styles.inTitle}>{item.title}</p>
                      <p className={styles.inBody}>{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.block}>
                <span className={styles.blockDot} aria-hidden="true" />
                <p className={styles.blockLabel}>{panel.lenses.label}</p>
                <ul className={styles.lensList}>
                  {panel.lenses.items.map((lens) => (
                    <li className={styles.lens} key={lens.title}>
                      <p className={styles.lensTitle}>{lens.title}</p>
                      <p className={styles.lensBody}>{lens.body}</p>
                    </li>
                  ))}
                </ul>
                <div className={styles.bracket} aria-hidden="true" />
                <div className={styles.stem} aria-hidden="true" />
                <p className={styles.bridge}>{panel.lenses.bridge}</p>
              </div>
              <div className={`${styles.block} ${styles.blockOut}`}>
                <span className={styles.blockDot} aria-hidden="true" />
                <p className={`${styles.blockLabel} ${styles.blockLabelOut}`}>
                  {panel.comesOut.label}
                </p>
                <ol className={styles.rows}>
                  {panel.comesOut.items.map((row) => (
                    <li className={styles.row} key={row.num}>
                      <span className={styles.rowNum} aria-hidden="true">
                        {row.num}
                      </span>
                      <span className={styles.rowTitle}>{row.title}</span>
                      <span className={styles.rowFormat}>{row.format}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className={styles.timeline}>{panel.timeline}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
