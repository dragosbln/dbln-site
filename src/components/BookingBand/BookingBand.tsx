import Reveal from "@/components/Reveal";
import { booking, site } from "@/content/site";
import type { BookingBandContent } from "@/content/types";
import { richText } from "@/lib/richText";
import CalendarGate from "./CalendarGate";
import styles from "./BookingBand.module.css";

type BookingBandProps = {
  content: BookingBandContent;
  /**
   * The Cal.com embed namespace, one per page that renders the band
   * (`home`, `customer-operations-review`): `cal("on", …)` adds window
   * listeners that are never removed, so two pages on one namespace would
   * double-register the handlers across a client-side navigation.
   * `BookingFlow` keeps `booking`.
   */
  namespace: string;
};

/**
 * The dark "Let's talk" booking band (design: the approved homepage and the
 * customer-operations review page): the invitation on the left, the paper
 * card with the click-to-load calendar on the right. The card is the client
 * leaf (`CalendarGate`); this shell stays a server component. The event is
 * the same Cal.com event as `BookingFlow`'s (`booking.event`), without the
 * situation picker.
 */
export default function BookingBand({ content, namespace }: BookingBandProps) {
  return (
    <section
      id="contact"
      className={styles.band}
      aria-labelledby="contact-title"
    >
      <div className="wrap">
        <div className={styles.grid}>
          <div>
            <Reveal as="p" className={styles.label}>
              {content.label}
            </Reveal>
            <Reveal as="h2" id="contact-title" className={styles.title}>
              {richText(content.title)}
            </Reveal>
            <Reveal as="p" className={styles.body}>
              {content.body}
            </Reveal>
            <Reveal as="p" className={styles.prep}>
              {content.prep}
            </Reveal>
            <Reveal className={styles.mail}>
              <p>{content.mailPrompt}</p>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </Reveal>
          </div>
          <CalendarGate
            copy={content.card}
            calLink={booking.event.calLink}
            email={site.email}
            namespace={namespace}
          />
        </div>
      </div>
    </section>
  );
}
