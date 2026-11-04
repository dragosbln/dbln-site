import { Fragment } from "react";
import Image from "next/image";
import ArrowIcon from "@/components/ArrowIcon";
import HashLink from "@/components/HashLink";
import { hero, site } from "@/content/site";
import type { NavItem } from "@/content/types";
import { hrefKind } from "@/lib/hrefKind";
import { richText } from "@/lib/richText";
import styles from "./Hero.module.css";

/** A profile-foot link: a section of this site through HashLink, a profile in a new tab. */
function ProfileLink({ item }: { item: NavItem }) {
  if (hrefKind(item.href) === "internal") {
    return <HashLink href={item.href}>{item.label}</HashLink>;
  }
  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer">
      {item.label}
    </a>
  );
}

/**
 * The home hero: eyebrow, title, lede and the one call to action on the
 * left; the profile aside (portrait, role, bio, the personal commitment,
 * location and links) on the right, under the text below 800px. No Reveal:
 * it is above the fold.
 */
export default function Hero() {
  const { profile } = hero;
  // "·"-separated eyebrow segments each wrap as a unit; lines may break
  // only after a separator (the space between the nowrap spans).
  const eyebrowSegments = hero.eyebrow.split(" · ");
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
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
            <h1 id="hero-title" className={styles.title}>
              {richText(hero.title)}
            </h1>
            <p className={styles.lede}>{hero.lede}</p>
            <div className={styles.actions}>
              <HashLink className={styles.primary} href={hero.cta.href}>
                {hero.cta.label} <ArrowIcon size={15} />
              </HashLink>
            </div>
          </div>
          <aside className={styles.profile} aria-label={profile.label}>
            <div className={styles.identity}>
              <Image
                className={styles.portrait}
                src={site.portrait}
                alt={site.name}
                width={68}
                height={68}
                sizes="68px"
              />
              <div>
                <h2 className={styles.name}>{site.name}</h2>
                <p className={styles.role}>{profile.role}</p>
              </div>
            </div>
            <p className={styles.bio}>{profile.bio}</p>
            <p className={styles.commitment}>{profile.commitment}</p>
            <div className={styles.foot}>
              <p>{profile.location}</p>
              <div className={styles.links}>
                {profile.links.map((item) => (
                  <ProfileLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
