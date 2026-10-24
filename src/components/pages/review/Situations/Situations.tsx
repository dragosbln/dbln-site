import ArrowIcon from "@/components/ArrowIcon";
import BookingLink from "@/components/BookingLink";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, situations } from "@/content/review";
import styles from "./Situations.module.css";

const titleId = `${anchors.situations}-title`;

/**
 * 01 · When you need this. Each card is one link to the booking section
 * that also preselects its situation in the picker (`BookingLink`).
 */
export default function Situations() {
  const { covers, notFit } = situations;
  return (
    <section
      id={anchors.situations}
      className="section"
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={situations.num}
          title={situations.title}
          id={titleId}
          aside={situations.aside}
          className={styles.head}
        />
        <Reveal as="ul" className={styles.cards}>
          {situations.items.map((item) => (
            <li className={styles.cardItem} key={item.situation}>
              <BookingLink
                className={styles.card}
                href={situations.bookingHref}
                situation={item.situation}
              >
                <span className={styles.kicker}>{item.kicker}</span>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardBody}>{item.body}</span>
                <span className={styles.go}>
                  {item.cta} <ArrowIcon size={12} />
                </span>
              </BookingLink>
            </li>
          ))}
        </Reveal>
        <Reveal className={styles.row}>
          <div>
            <p className={styles.label}>{covers.label}</p>
            <ul className={styles.covers}>
              {covers.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.star}>
              <span className={styles.starMark} aria-hidden="true">
                *
              </span>
              <span>{covers.note}</span>
            </p>
          </div>
          <div className={styles.notFit}>
            <p className={styles.label}>{notFit.label}</p>
            <ul className={styles.notFitList}>
              {notFit.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
