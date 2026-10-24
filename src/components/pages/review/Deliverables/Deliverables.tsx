import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, deliverables } from "@/content/review";
import DocumentSwitcher from "./DocumentSwitcher";
import styles from "./Deliverables.module.css";

/** 03 · What you get (design: 03-what-you-get.dc.html). */
export default function Deliverables() {
  const titleId = `${anchors.deliverables}-title`;
  return (
    <section
      id={anchors.deliverables}
      className="section"
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={deliverables.num}
          title={deliverables.title}
          id={titleId}
          aside={deliverables.aside}
          className={styles.head}
        />
        <Reveal as="p" className={styles.note}>
          {deliverables.note}
        </Reveal>
        <Reveal>
          <DocumentSwitcher
            tiers={deliverables.tiers}
            documents={deliverables.documents}
            pickerLabel={deliverables.pickerLabel}
          />
        </Reveal>
        <Reveal as="p" className={styles.close}>
          {deliverables.close}
        </Reveal>
      </div>
    </section>
  );
}
