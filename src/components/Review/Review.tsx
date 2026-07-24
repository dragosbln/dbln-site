import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { review } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./Review.module.css";

export default function Review() {
  return (
    <section id="review" className="section" aria-labelledby="review-title">
      <div className="wrap">
        <SectionHead
          num={review.num}
          title={review.title}
          id="review-title"
          aside={review.aside}
        />
        <Reveal className={styles.card}>
          <div className={styles.scope}>
            <p className={styles.scopeLead}>{review.scope.lead}</p>
            <p className={styles.scopeNote}>{review.scope.note}</p>
          </div>
          <div className={styles.steps}>
            {review.steps.map((step) => {
              const List = step.ordered ? "ol" : "ul";
              return (
                <div className={styles.step} key={step.eyebrow}>
                  <p className={styles.eyebrow}>{step.eyebrow}</p>
                  <p className={styles.lead}>{step.lead}</p>
                  <List className={styles.list}>
                    {step.items.map((item, index) => (
                      <li key={item}>
                        <span className={styles.marker} aria-hidden="true">
                          {step.ordered ? index + 1 : "—"}
                        </span>
                        <span>{richText(item)}</span>
                      </li>
                    ))}
                  </List>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
