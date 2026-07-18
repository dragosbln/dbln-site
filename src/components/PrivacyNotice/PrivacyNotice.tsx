import Reveal from "@/components/Reveal";
import { privacy } from "@/content/privacy";
import { site } from "@/content/site";
import { formatFullDate } from "@/lib/format";
import { richText } from "@/lib/richText";
import styles from "./PrivacyNotice.module.css";

/** The /privacy body: numbered blocks, then the contact block's mail link. */
export default function PrivacyNotice() {
  return (
    <section className={styles.notice} aria-label="Privacy notice">
      <div className="wrap">
        <p className={styles.updated}>
          {privacy.updatedLabel} {formatFullDate(privacy.updated)}
        </p>
        <ul className={styles.list}>
          {privacy.sections.map((section) => (
            <Reveal as="li" className={styles.row} key={section.num}>
              <div className={styles.head}>
                <p className={styles.num} aria-hidden="true">
                  {section.num}
                </p>
                <h2 className={styles.title}>{section.title}</h2>
              </div>
              <div className={styles.body}>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{richText(paragraph)}</p>
                ))}
              </div>
            </Reveal>
          ))}
          <Reveal as="li" className={styles.row}>
            <div className={styles.head}>
              <p className={styles.num} aria-hidden="true">
                {privacy.contact.num}
              </p>
              <h2 className={styles.title}>{privacy.contact.title}</h2>
            </div>
            <div className={styles.body}>
              {privacy.contact.body.map((paragraph) => (
                <p key={paragraph}>{richText(paragraph)}</p>
              ))}
              <p className={styles.mailRow}>
                <a className={styles.mail} href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                <span className={styles.mailHint}>
                  {privacy.contact.emailHint}
                </span>
              </p>
            </div>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
