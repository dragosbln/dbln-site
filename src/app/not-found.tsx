import Link from "next/link";
import type { Metadata } from "next";
import ArrowIcon from "@/components/ArrowIcon";
import { notFound } from "@/content/site";
import { richText } from "@/lib/richText";
import styles from "./not-found.module.css";

// Next emits this as /404.html in a static export. Firebase Hosting serves it
// automatically on any path that doesn't match a file in `out/`.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className={styles.main}>
      <div className="wrap">
        <p className={styles.eyebrow}>{notFound.eyebrow}</p>
        <h1 className={styles.title}>{richText(notFound.title)}</h1>
        <p className={styles.lede}>{notFound.lede}</p>
        <ul className={styles.links}>
          {notFound.links.map((link) => (
            <li key={link.href}>
              <Link className={styles.link} href={link.href}>
                {link.label} <ArrowIcon size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
