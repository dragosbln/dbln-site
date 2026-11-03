import Reveal from "@/components/Reveal";
import { booking, homeBooking, site } from "@/content/site";
import { richText } from "@/lib/richText";
import CalendarGate from "./CalendarGate";
import styles from "./Booking.module.css";

/**
 * The home page's booking band (design: the dark "Let's talk" section of the
 * approved homepage): the invitation on the left, the paper card with the
 * click-to-load calendar on the right. The card is the client leaf
 * (`CalendarGate`); this shell stays a server component. The event is the
 * same Cal.com event as `BookingFlow`'s (`booking.event`), without the
 * situation picker.
 */
export default function Booking() {
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
              {homeBooking.label}
            </Reveal>
            <Reveal as="h2" id="contact-title" className={styles.title}>
              {richText(homeBooking.title)}
            </Reveal>
            <Reveal as="p" className={styles.body}>
              {homeBooking.body}
            </Reveal>
            <Reveal as="p" className={styles.prep}>
              {homeBooking.prep}
            </Reveal>
            <Reveal className={styles.mail}>
              <p>{homeBooking.mailPrompt}</p>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </Reveal>
          </div>
          <CalendarGate
            copy={homeBooking.card}
            calLink={booking.event.calLink}
            email={site.email}
          />
        </div>
      </div>
    </section>
  );
}
