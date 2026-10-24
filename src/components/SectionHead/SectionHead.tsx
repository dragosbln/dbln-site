import HashLink from "@/components/HashLink";
import Reveal from "@/components/Reveal";
import type { NavItem } from "@/content/types";
import styles from "./SectionHead.module.css";

type SectionHeadProps = {
  num: string;
  title: string;
  /** h2 id — the owning <section> points at it via aria-labelledby. */
  id: string;
  aside?: string;
  /** Optional link appended after the aside text. */
  asideLink?: NavItem;
  /**
   * Text right after the link. When set, the link renders inline (no arrow,
   * free to wrap) so the aside reads as one sentence: "…skip this and
   * [book the call]."
   */
  asideTail?: string;
  /**
   * Keep the aside under 760px, on its own row under the title, instead of
   * hiding it there. For asides that carry a way forward, not a gloss.
   */
  asideOnPhone?: boolean;
  /**
   * Appended to the root's class. Its one intended use is the gap under the
   * head: set `--head-gap` in that class (never `margin-bottom`, which would
   * race this module's rule on stylesheet order). Static per instance: the
   * root is a Reveal, and a Reveal whose className changes on a live
   * instance loses its `.in` class (AGENTS.md).
   */
  className?: string;
};

/** Numbered section heading ("01 / Selected work" + optional right aside). */
export default function SectionHead({
  num,
  title,
  id,
  aside,
  asideLink,
  asideTail,
  asideOnPhone,
  className,
}: SectionHeadProps) {
  const rootClass = [
    styles.head,
    asideOnPhone ? styles.asideOnPhone : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Reveal className={rootClass}>
      <span className={styles.num} aria-hidden="true">
        {num}
      </span>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {aside ? (
        <p className={styles.aside}>
          {aside}{" "}
          {asideLink && asideTail ? (
            <>
              <HashLink className={styles.asideLink} href={asideLink.href}>
                {asideLink.label}
              </HashLink>
              {asideTail}
            </>
          ) : asideLink ? (
            <HashLink
              className={`${styles.asideLink} ${styles.nowrap}`}
              href={asideLink.href}
            >
              {asideLink.label} <span aria-hidden="true">→</span>
            </HashLink>
          ) : null}
        </p>
      ) : null}
    </Reveal>
  );
}
