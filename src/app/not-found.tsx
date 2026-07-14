import Link from "next/link";
import type { Metadata } from "next";
import ArrowIcon from "@/components/ArrowIcon";
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
        <p className={styles.eyebrow}>Error · 404</p>
        <h1 className={styles.title}>
          That page <em>isn&apos;t here.</em>
        </h1>
        <p className={styles.lede}>
          The URL is wrong, the page has moved, or it was never real. Head back
          to the front, or pick one of these.
        </p>
        <ul className={styles.links}>
          <li>
            <Link className={styles.link} href="/">
              Home <ArrowIcon size={14} />
            </Link>
          </li>
          <li>
            <Link className={styles.link} href="/work">
              Selected work <ArrowIcon size={14} />
            </Link>
          </li>
          <li>
            <Link className={styles.link} href="/blog">
              Writing <ArrowIcon size={14} />
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
