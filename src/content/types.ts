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

export type Article = {
  /** Future /blog/<slug> route segment. */
  slug: string;
  title: string;
  /** ISO date, e.g. "2026-06-09". */
  date: string;
  /** Minutes. */
  readTime: number;
  tags: string[];
};

export type WorkSection = SectionIntro & { items: WorkItem[] };
export type EngagementsSection = SectionIntro & { items: Engagement[] };
export type TestimonialsSection = SectionIntro & { items: Testimonial[] };
export type AgenticSection = SectionIntro & {
  /** Rich text pull quote. */
  pull: string;
  items: AgenticItem[];
};
export type WritingSection = SectionIntro & { articles: Article[] };

export type Contact = {
  label: string;
  /** Rich text. */
  title: string;
  body: string;
  cta: string;
};
