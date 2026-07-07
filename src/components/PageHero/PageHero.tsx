import type { PageHero as PageHeroContent } from "@/content/types";
import { richText } from "@/lib/richText";
import styles from "./PageHero.module.css";

type PageHeroProps = {
  content: PageHeroContent;
};

/** Inner-page hero (work, blog): eyebrow + serif h1 + lede. */
export default function PageHero({ content }: PageHeroProps) {
  return (
    <div className={styles.hero}>
      <div className="wrap">
        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label}>{content.eyebrow}</span>
        </p>
        <h1 className={styles.title}>{richText(content.title)}</h1>
        <p className={styles.lede}>{content.lede}</p>
      </div>
    </div>
  );
}
