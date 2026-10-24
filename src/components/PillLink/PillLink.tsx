import type { ReactNode } from "react";
import ArrowIcon from "@/components/ArrowIcon";
import HashLink from "@/components/HashLink";
import { hrefKind } from "@/lib/hrefKind";
import styles from "./PillLink.module.css";

type PillLinkProps = {
  href: string;
  children: ReactNode;
  /** Appends the arrow, as on the hero's primary button. */
  arrow?: boolean;
  /** Full width, label centred. */
  block?: boolean;
  className?: string;
};

/**
 * The ink pill call to action (the hero's primary button), for any href in
 * content: a mailto or an external URL renders a plain anchor (external ones
 * in a new tab), a page or section of this site renders through `HashLink`.
 */
export default function PillLink({
  href,
  children,
  arrow,
  block,
  className,
}: PillLinkProps) {
  const classes = [styles.pill, block ? styles.block : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const label = arrow ? (
    <>
      {children} <ArrowIcon />
    </>
  ) : (
    children
  );
  switch (hrefKind(href)) {
    case "mailto":
      return (
        <a className={classes} href={href}>
          {label}
        </a>
      );
    case "external":
      return (
        <a
          className={classes}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      );
    case "internal":
      return (
        <HashLink className={classes} href={href}>
          {label}
        </HashLink>
      );
  }
}
