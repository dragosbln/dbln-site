import Reveal from "@/components/Reveal";
import { contact, site } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./Contact.module.css";

export default function Contact() {
  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <div className="wrap">
        <Reveal as="p" className={styles.label}>
          {contact.label}
        </Reveal>
        <Reveal as="h2" id="contact-title" className={styles.title}>
          {richText(contact.title)}
        </Reveal>
        <Reveal as="p" className={styles.body}>
          {contact.body}
        </Reveal>
        <Reveal className={styles.actions}>
          <a className={styles.primary} href={`mailto:${site.email}`}>
            {contact.cta}
          </a>
          <a className={styles.mail} href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
