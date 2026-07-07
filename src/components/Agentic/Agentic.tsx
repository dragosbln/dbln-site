import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { agentic } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./Agentic.module.css";

export default function Agentic() {
  return (
    <section id="agentic" className="section" aria-labelledby="agentic-title">
      <div className="wrap">
        <SectionHead
          num={agentic.num}
          title={agentic.title}
          id="agentic-title"
          aside={agentic.aside}
        />
        <div className={styles.flex}>
          <Reveal as="p" className={styles.pull}>
            {richText(agentic.pull)}
          </Reveal>
          <Reveal as="ul" className={styles.list}>
            {agentic.items.map((item) => (
              <li className={styles.item} key={item.kicker}>
                <span className={styles.kicker}>{item.kicker}</span>
                <div>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <p className={styles.itemBody}>{item.body}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
