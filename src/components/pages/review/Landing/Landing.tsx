import { Fragment } from "react";
import ArrowIcon from "@/components/ArrowIcon";
import HashLink from "@/components/HashLink";
import PillLink from "@/components/PillLink";
import { landing } from "@/content/review";
import GlanceList from "./GlanceList";
import styles from "./Landing.module.css";

/**
 * The /review hero: eyebrow, title, lede and three doors on the left, the
 * "at a glance" panel on the right (under the text below 980px). No Reveal,
 * as on the home Hero: it is above the fold.
 */
export default function Landing() {
  const { doors, panel } = landing;
  // "·"-separated eyebrow segments each wrap as a unit; lines may break
  // only after a separator (the space between the nowrap spans).
  const eyebrowSegments = landing.eyebrow.split(" · ");
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className="wrap">
        <div className={styles.grid}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.label}>
                {eyebrowSegments.map((segment, index) => (
                  <Fragment key={segment}>
                    <span className={styles.segment}>
                      {index < eyebrowSegments.length - 1
                        ? `${segment} ·`
                        : segment}
                    </span>
                    {index < eyebrowSegments.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </span>
            </p>
            <h1 id="landing-title" className={styles.title}>
              {landing.title}
            </h1>
            <p className={styles.lede}>{landing.lede}</p>
            <div className={styles.doors}>
              <div className={styles.doorRow}>
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
              <div className={styles.plainRow}>
                <HashLink className={styles.plain} href={doors.tertiary.href}>
                  {doors.tertiary.label}
                </HashLink>
              </div>
            </div>
          </div>
          <div className={styles.panel} role="group" aria-label={panel.title}>
            <p className={styles.panelHead}>
              <span className={styles.panelTitle}>{panel.title}</span>
            </p>
            <GlanceList
              label={panel.comesOut.label}
              items={panel.comesOut.items}
              timeline={panel.timeline}
              excerptNote={panel.excerptNote}
            >
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
              <div className={`${styles.block} ${styles.blockLenses}`}>
                <span className={styles.blockDot} aria-hidden="true" />
                <p className={styles.blockLabel}>{panel.lenses.label}</p>
                <ul className={styles.lensList}>
                  {panel.lenses.items.map((lens) => (
                    <li className={styles.lens} key={lens.title}>
                      <p className={styles.lensTitle}>{lens.title}</p>
                      <p className={styles.lensBody}>
                        {lens.bodyShort ? (
                          <>
                            <span className={styles.lensLong}>{lens.body}</span>
                            <span className={styles.lensShort}>
                              {lens.bodyShort}
                            </span>
                          </>
                        ) : (
                          lens.body
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className={styles.bracket} aria-hidden="true" />
                <div className={styles.stem} aria-hidden="true" />
                <p className={styles.bridge}>{panel.lenses.bridge}</p>
              </div>
            </GlanceList>
          </div>
        </div>
      </div>
    </section>
  );
}
