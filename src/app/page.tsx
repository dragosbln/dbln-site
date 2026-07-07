import type { Metadata } from "next";
import { site } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// Placeholder home page — replaced by the full Direction A landing page
// (hero, work, engagements, testimonials, agentic, writing, contact).
export default function Home() {
  return (
    <main id="main" className={styles.main}>
      <div className="wrap">
        <p className={styles.label}>{site.role}</p>
        <h1 className={styles.title}>
          I help teams get the <em>expensive-to-reverse</em> decisions right,
          then build them.
        </h1>
        <p className={styles.lede}>
          Eight years of architecture and platform work across insurance, Web3
          and health-tech. I&apos;m hired for judgment on the calls that are
          hard to undo: auth, data, system boundaries. And for the engineering
          to ship them.
        </p>
        <p>
          <a className={styles.mail} href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </p>
      </div>
    </main>
  );
}
