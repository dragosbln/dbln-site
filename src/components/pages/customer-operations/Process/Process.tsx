import ChevronIcon from "@/components/ChevronIcon";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, process } from "@/content/customerOperations";
import { richText } from "@/lib/richText";
import styles from "./Process.module.css";

/** One `name` across the phases: opening a step closes the open one. */
const GROUP = "review-process-step";

/**
 * 02 · How it runs (design: T1 in the customer-operations reference): three
 * phases, each a label column beside its numbered steps. A step is a native
 * `<details>`, collapsed at first, with the time indicator right-aligned on
 * the summary row and the detail (prose, "Your team", "Checkpoint") inside;
 * every detail is in the HTML. No client code.
 */
export default function Process() {
  const titleId = `${anchors.process}-title`;
  return (
    <section
      id={anchors.process}
      className={`section ${styles.section}`}
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={process.num}
          title={process.title}
          id={titleId}
          aside={process.aside}
          asideOnPhone
          className={styles.head}
        />
        {process.phases.map((phase) => (
          <Reveal key={phase.title} className={styles.phase}>
            <div className={styles.phaseLabel}>
              <h3 className={styles.phaseTitle}>{phase.title}</h3>
              <p className={styles.phaseNote}>{phase.note}</p>
            </div>
            <div className={styles.phaseBody}>
              <ol className={styles.sequence} start={Number(phase.steps[0].num)}>
                {phase.steps.map((step) => (
                  <li key={step.num} className={styles.step}>
                    <details className={styles.details} name={GROUP}>
                      <summary className={styles.summary}>
                        <span className={styles.num} aria-hidden="true">
                          {step.num}
                        </span>
                        <span className={styles.main}>
                          <span className={styles.top}>
                            <span className={styles.name}>{step.name}</span>
                            <span className={styles.timing}>{step.timing}</span>
                          </span>
                          <span className={styles.brief}>{step.summary}</span>
                        </span>
                        <span className={styles.disclosure}>
                          <ChevronIcon size={14} />
                        </span>
                      </summary>
                      <div className={styles.detail}>
                        <p className={styles.prose}>{step.prose}</p>
                        <dl className={styles.meta}>
                          <div>
                            <dt>{process.meta.team}</dt>
                            <dd>{step.team}</dd>
                          </div>
                          <div>
                            <dt>{process.meta.checkpoint}</dt>
                            <dd>{step.checkpoint}</dd>
                          </div>
                        </dl>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
              {phase.critical ? (
                <p className={styles.critical}>{richText(phase.critical)}</p>
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
