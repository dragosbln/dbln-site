import Link from "next/link";
import { Fragment } from "react";
import ArrowIcon from "@/components/ArrowIcon";
import { hero } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./Hero.module.css";

export default function Hero() {
  // "·"-separated eyebrow segments each wrap as a unit; lines may break
  // only after a separator (the space between the nowrap spans).
  const eyebrowSegments = hero.eyebrow.split(" · ");
  return (
    <div className={styles.hero}>
      <div className="wrap">
        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label}>
            {eyebrowSegments.map((segment, index) => (
              <Fragment key={segment}>
                <span className={styles.segment}>
                  {index < eyebrowSegments.length - 1
                    ? `${segment} ·`
                    : segment}
                </span>
                {index < eyebrowSegments.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        </p>
        <div className={styles.grid}>
          <div>
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
    </div>
  );
}
