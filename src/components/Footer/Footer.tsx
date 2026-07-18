import Link from "next/link";
import { site, socialLinks } from "@/content/site";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.legal}>
          <p>
            © {new Date().getFullYear()} {site.name} · {site.company}
          </p>
          <Link className={styles.privacy} href="/privacy">
            Privacy Notice
          </Link>
        </div>
        <ul className={styles.socials} aria-label="Profiles">
          {socialLinks.map((social) => (
            <li key={social.label}>
              <a href={social.href} target="_blank" rel="noopener noreferrer">
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
