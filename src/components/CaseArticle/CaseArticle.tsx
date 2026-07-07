import CaseDiagram from "@/components/CaseDiagram";
import Reveal from "@/components/Reveal";
import type { CaseStudy } from "@/content/types";
import { richText } from "@/lib/richText";
import styles from "./CaseArticle.module.css";

type CaseArticleProps = {
  caseStudy: CaseStudy;
  /** Zero-based position in the case list — renders as "01", "02", … */
  index: number;
};

/** One case study, "Casebook" layout: sticky meta rail + main column. */
export default function CaseArticle({ caseStudy: c, index }: CaseArticleProps) {
  return (
    <Reveal as="article" id={c.id} className={styles.case}>
      <div className={styles.grid}>
        <aside className={styles.rail}>
          <p className={styles.idx} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </p>
          <dl className={styles.meta}>
            <div className={styles.railRow}>
              <dt>Period</dt>
              <dd>{c.period}</dd>
            </div>
            <div className={styles.railRow}>
              <dt>Role</dt>
              <dd>{c.role}</dd>
            </div>
            <div className={styles.railRow}>
              <dt>Engagement</dt>
              <dd>{c.engagement}</dd>
            </div>
            <div className={styles.railRow}>
              <dt>Stack</dt>
              <dd>
                <ul className={styles.stack}>
                  {c.stack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
        <div>
          <p className={styles.sector}>{c.sector}</p>
          <h2 className={styles.name}>{c.name}</h2>
          <p className={styles.tagline}>{c.tagline}</p>
          <div className={styles.stats}>
            {c.outcomes.map((outcome) => (
              <div className={styles.stat} key={outcome.label}>
                <div className={styles.num}>{outcome.stat}</div>
                <div className={styles.lbl}>{outcome.label}</div>
              </div>
            ))}
          </div>
          <div className={styles.spine}>
            <h3>Situation</h3>
            <p>{richText(c.situation)}</p>
          </div>
          <div className={`${styles.spine} ${styles.decision}`}>
            <h3>The decision that mattered</h3>
            <p>{richText(c.decision)}</p>
          </div>
          <div className={styles.spine}>
            <h3>Approach</h3>
            <p>{richText(c.approach)}</p>
          </div>
          {c.diagram ? <CaseDiagram id={c.id} /> : null}
          {c.proof ? (
            <figure className={styles.proof}>
              <blockquote>
                <p>{c.proof.quote}</p>
              </blockquote>
              <figcaption>
                <span className={styles.proofName}>{c.proof.name}</span>
                <span className={styles.proofRole}>{c.proof.role}</span>
              </figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}
