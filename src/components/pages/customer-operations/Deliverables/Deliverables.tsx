import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, deliverables } from "@/content/customerOperations";
import DeliverableBrowser from "./DeliverableBrowser";
import styles from "./Deliverables.module.css";

/**
 * 03 · What you get (design: W2 in the customer-operations reference): the
 * deliverable browser with illustrative excerpts of the refund review. The
 * browser is the client leaf; its five panels are all in the HTML.
 */
export default function Deliverables() {
  const titleId = `${anchors.deliverables}-title`;
  return (
    <section
      id={anchors.deliverables}
      className={`section ${styles.section}`}
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={deliverables.num}
          title={deliverables.title}
          id={titleId}
          aside={deliverables.aside}
          asideOnPhone
          className={styles.head}
        />
        <Reveal>
          <DeliverableBrowser content={deliverables} />
        </Reveal>
      </div>
    </section>
  );
}
