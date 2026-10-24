import SectionHead from "@/components/SectionHead";
import { anchors, rail } from "@/content/review";
import RailBody from "./RailBody";
import styles from "./Rail.module.css";

const titleId = `${anchors.rail}-title`;

/**
 * Section 02, "How it runs". The sticky reading switch spans the full width
 * (hairlines edge to edge), so the head and the rail sit in their own
 * `.wrap`s and the switch between them, inside RailBody.
 */
export default function Rail() {
  return (
    <section id={anchors.rail} className="section" aria-labelledby={titleId}>
      <div className="wrap">
        <SectionHead
          num={rail.num}
          title={rail.title}
          id={titleId}
          aside={rail.aside}
          className={styles.head}
        />
      </div>
      <RailBody content={rail} />
    </section>
  );
}
