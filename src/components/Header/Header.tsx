import Link from "next/link";
import Logo from "@/components/Logo";
import { nav, site } from "@/content/site";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <Logo className={styles.mark} />
          <span className={styles.name}>
            {site.name} <span className={styles.co}>/ Luckylabs</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Main">
          {nav.links.map((link) => (
            <Link key={link.href} className={styles.link} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className={styles.cta} href={nav.cta.href}>
            {nav.cta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
