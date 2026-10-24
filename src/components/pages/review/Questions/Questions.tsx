import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, questions } from "@/content/review";
import QuestionList from "./QuestionList";
import styles from "./Questions.module.css";

/** 06 · Questions (design: 06-questions.dc.html). */
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
          <QuestionList
            items={questions.items}
            visibleCount={questions.visibleCount}
            moreLabel={questions.moreLabel}
          />
        </Reveal>
      </div>
    </section>
  );
}
