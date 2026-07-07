import Link from "next/link";
import ArrowIcon from "@/components/ArrowIcon";
import { hero } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <div className={styles.hero}>
      <div className="wrap">
        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label}>{hero.eyebrow}</span>
        </p>
        <h1 className={styles.title}>{richText(hero.title)}</h1>
        <p className={styles.lede}>{hero.lede}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={hero.actions.primary.href}>
            {hero.actions.primary.label} <ArrowIcon />
          </Link>
          <Link className={styles.ghost} href={hero.actions.secondary.href}>
            {hero.actions.secondary.label} <ArrowIcon size={13} />
          </Link>
        </div>
        <dl className={styles.meta}>
          {hero.meta.map((item) => (
            <div className={styles.metaItem} key={item.key}>
              <dt>{item.key}</dt>
              <dd>
                {item.value}
                <small>{item.detail}</small>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
