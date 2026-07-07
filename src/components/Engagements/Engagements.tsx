import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { engagements } from "@/content/site";
import styles from "./Engagements.module.css";

export default function Engagements() {
  return (
    <section id="engage" className="section" aria-labelledby="engage-title">
      <div className="wrap">
        <SectionHead
          num={engagements.num}
          title={engagements.title}
          id="engage-title"
          aside={engagements.aside}
        />
        <Reveal as="ul" className={styles.grid}>
          {engagements.items.map((item) => (
            <li className={styles.card} key={item.id}>
              <p className={styles.cardNum} aria-hidden="true">
                {item.id}
              </p>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.body}>{item.body}</p>
              <p className={styles.when}>
                {item.when}
                <span>{item.scope}</span>
              </p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
