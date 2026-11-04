import QuestionList from "@/components/QuestionList";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, questions } from "@/content/customerOperations";
import styles from "./Questions.module.css";

/** 05 · Questions (design: Q1 in the customer-operations reference): seven, all shown. */
export default function Questions() {
  const titleId = `${anchors.questions}-title`;
  return (
    <section
      id={anchors.questions}
      className="section"
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={questions.num}
          title={questions.title}
          id={titleId}
          className={styles.head}
        />
        <Reveal>
          <QuestionList items={questions.items} />
        </Reveal>
      </div>
    </section>
  );
}
