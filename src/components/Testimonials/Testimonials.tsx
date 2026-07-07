import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { testimonials } from "@/content/site";
import styles from "./Testimonials.module.css";

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="section"
      aria-labelledby="testimonials-title"
    >
      <div className="wrap">
        <SectionHead
          num={testimonials.num}
          title={testimonials.title}
          id="testimonials-title"
          aside={testimonials.aside}
        />
        <ul className={styles.grid}>
          {testimonials.items.map((item) => (
            <Reveal as="li" className={styles.card} key={item.name}>
              <figure className={styles.figure}>
                <span className={styles.mark} aria-hidden="true">
                  “
                </span>
                <blockquote className={styles.quote}>
                  <p>{item.quote}</p>
                </blockquote>
                <figcaption className={styles.who}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.role}>{item.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
