/**
 * Content shapes. Every content export in src/content/ is annotated with one
 * of these so pages and components share a single contract.
 *
 * Strings marked "rich text" support the inline-markup subset rendered by
 * src/lib/richText.tsx: **text** -> <strong>, *text* -> <em>.
 */

export type NavItem = {
  label: string;
  href: string;
};

export type SectionIntro = {
  /** Two-digit section number, e.g. "01". */
  num: string;
  title: string;
  aside?: string;
  /** Optional link appended after the aside text. */
  asideLink?: NavItem;
};

export type PageHero = {
  eyebrow: string;
  /** Rich text. */
  title: string;
  lede: string;
  /** Plain-text page summary for <meta name="description">, og and feeds. */
  metaDescription: string;
};

export type Hero = {
  eyebrow: string;
  /** Rich text. */
  title: string;
  lede: string;
  actions: { primary: NavItem; secondary: NavItem };
  meta: { key: string; value: string; detail: string }[];
};

export type WorkItem = {
  period: string;
  title: string;
  /** "Role · Company" sub-line. */
  role: string;
  /** Rich text — stats emphasized with **…**. */
  body: string;
  tags: string[];
};

export type Engagement = {
  /** Single-letter index, e.g. "A". */
  id: string;
  title: string;
  body: string;
  /** "Best before …" one-liner. */
  when: string;
  /** Short scope list, "·"-separated. */
  scope: string;
};

export type Testimonial = {
  /** Verbatim — never rewrite real quotes. */
  quote: string;
  name: string;
  role: string;
};

export type AgenticItem = {
  /** Mono kicker, e.g. "Quality". */
  kicker: string;
  title: string;
  body: string;
};

export type Post = {
  /** /blog/<slug> route segment; also the markdown filename in src/content/posts. */
  slug: string;
  title: string;
  /** ISO date, e.g. "2026-06-09". */
  date: string;
  /** Minutes — computed from word count by src/lib/posts.ts, not authored. */
  readTime: number;
  tags: string[];
  excerpt: string;
  /** Cover figure, e.g. "/blog/covers/<slug>.svg". */
  cover: string;
  coverAlt: string;
  /** ISO date of the last substantive revision, when one happened. */
  updated?: string;
  /** URL of the dev.to cross-post, when one exists. */
  devto?: string;
};

export type PostWithBody = Post & {
  /** Raw markdown body (no frontmatter). */
  body: string;
};

export type CaseOutcome = {
  /** Short figure, e.g. "150k+" or "OAuth". */
  stat: string;
  label: string;
};

export type CaseStudy = {
  /** Anchor id, jump-nav target and diagram-registry key. */
  id: string;
  name: string;
  /** "Sector · qualifier" mono kicker. */
  sector: string;
  period: string;
  role: string;
  engagement: string;
  tagline: string;
  /** Rich text. The spine is fixed: situation → decision → approach. */
  situation: string;
  /** Rich text. */
  decision: string;
  /** Rich text. */
  approach: string;
  outcomes: CaseOutcome[];
  proof: Testimonial | null;
  stack: string[];
  /**
   * Present when the case shows a diagram. The animated SVG is registered by
   * `id` in src/components/CaseDiagram; the caption (outward-facing copy)
   * lives here with the rest of the case content.
   */
  diagram?: { caption: string };
};

export type WorkSection = SectionIntro & { items: WorkItem[]; cta?: NavItem };
export type EngagementsSection = SectionIntro & { items: Engagement[] };
export type TestimonialsSection = SectionIntro & { items: Testimonial[] };
export type AgenticSection = SectionIntro & {
  /** Rich text pull quote. */
  pull: string;
  items: AgenticItem[];
};
export type WritingSection = SectionIntro & {
  /** How many of the newest posts the landing section shows. */
  featuredCount: number;
};

export type Contact = {
  label: string;
  /** Rich text. */
  title: string;
  body: string;
  cta: string;
};

export type NotFound = {
  eyebrow: string;
  /** Rich text. */
  title: string;
  lede: string;
  links: NavItem[];
};
