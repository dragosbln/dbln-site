import Reveal from "@/components/Reveal";
import styles from "./SectionHead.module.css";

type SectionHeadProps = {
  num: string;
  title: string;
  /** h2 id — the owning <section> points at it via aria-labelledby. */
  id: string;
  aside?: string;
};

/** Numbered section heading ("01 / Selected work" + optional right aside). */
export default function SectionHead({ num, title, id, aside }: SectionHeadProps) {
  return (
    <Reveal className={styles.head}>
      <span className={styles.num} aria-hidden="true">
        {num}
      </span>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {aside ? <p className={styles.aside}>{aside}</p> : null}
    </Reveal>
  );
}
