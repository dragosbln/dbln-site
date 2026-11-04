import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { anchors, story } from "@/content/customerOperations";
import type { StoryArt } from "@/content/types";
import { richText } from "@/lib/richText";
import StoryRail from "./StoryRail";
import styles from "./Story.module.css";

/** The sprite panel each illustrated step shows (Story.module.css). */
const ART_CLASS: Record<StoryArt, string> = {
  team: styles.artTeam,
  pattern: styles.artPattern,
  conditions: styles.artConditions,
};

/**
 * 01 · A review in practice (design: K1 in the customer-operations
 * reference): the narrow trigger card and three illustrated steps on a
 * horizontal snap rail, with Back/Next controls. The cards are server
 * rendered; `StoryRail` is the client leaf around them.
 */
export default function Story() {
  const titleId = `${anchors.story}-title`;
  return (
    <section
      id={anchors.story}
      className={`section ${styles.section}`}
      aria-labelledby={titleId}
    >
      <div className="wrap">
        <SectionHead
          num={story.num}
          title={story.title}
          id={titleId}
          aside={story.aside}
          asideOnPhone
          className={styles.head}
        />
        <Reveal>
          <StoryRail
            nav={story.nav}
            railLabel={story.railLabel}
            status={story.status}
            names={story.cards.map((card) => card.name)}
          >
            {story.cards.map((card) =>
              card.kind === "trigger" ? (
                <article
                  key={card.name}
                  className={`${styles.card} ${styles.trigger}`}
                  aria-label={card.ariaLabel}
                  data-card="true"
                >
                  <p className={styles.label}>{card.label}</p>
                  {/* One heading, two sentences: the same face, size and weight. */}
                  <h3 className={styles.triggerTitle}>{card.title}</h3>
                </article>
              ) : (
                <article
                  key={card.name}
                  className={styles.card}
                  aria-label={card.ariaLabel}
                  data-card="true"
                >
                  {/* The illustration floats right; the title and the lead
                      flow around it (under 440px it sits above them). */}
                  <div className={styles.flow}>
                    <figure
                      className={`${styles.art} ${ART_CLASS[card.art]}`}
                      role="img"
                      aria-label={card.artAlt}
                    />
                    <div className={styles.titleGroup}>
                      <p className={`${styles.label} ${styles.stepLabel}`}>
                        {card.label}
                      </p>
                      <h3 className={styles.cardTitle}>{card.title}</h3>
                    </div>
                    <p className={styles.lead}>{card.lead}</p>
                  </div>
                  <div className={styles.body}>
                    {card.finding ? (
                      <div className={styles.finding}>
                        <p>{card.finding}</p>
                      </div>
                    ) : null}
                    {card.body ? <p>{card.body}</p> : null}
                    {card.more ? (
                      <p className={styles.more}>{richText(card.more)}</p>
                    ) : null}
                  </div>
                </article>
              ),
            )}
          </StoryRail>
        </Reveal>
      </div>
    </section>
  );
}
