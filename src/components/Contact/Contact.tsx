import Reveal from "@/components/Reveal";
import { contact as defaultContent, site } from "@/content/site";
import type { Contact as ContactContent } from "@/content/types";
import { richText } from "@/lib/richText";
import styles from "./Contact.module.css";

type ContactProps = {
  /** Alternate copy for inner pages (e.g. workCta); defaults to the landing copy. */
  content?: ContactContent;
};

export default function Contact({ content = defaultContent }: ContactProps) {
  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <div className="wrap">
        <Reveal as="p" className={styles.label}>
          {content.label}
        </Reveal>
        <Reveal as="h2" id="contact-title" className={styles.title}>
          {richText(content.title)}
        </Reveal>
        <Reveal as="p" className={styles.body}>
          {content.body}
        </Reveal>
        <Reveal className={styles.actions}>
          <a className={styles.primary} href={`mailto:${site.email}`}>
            {content.cta}
          </a>
          <a className={styles.mail} href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
