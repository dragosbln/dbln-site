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
  /**
   * Text after the link. When present the link renders inline (no arrow)
   * so the aside reads as one sentence: "…skip this and [book the call]."
   */
  asideTail?: string;
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

export type ReviewStep = {
  /** Mono eyebrow, e.g. "01 · You provide". */
  eyebrow: string;
  /** Serif lead line, e.g. "Three inputs:". */
  lead: string;
  /** Rich text items. */
  items: string[];
  /** Numbered markers (ol) when true; em-dash markers (ul) otherwise. */
  ordered?: boolean;
};

export type Testimonial = {
  /** Verbatim — never rewrite real quotes. */
  quote: string;
  /**
   * A shorter cut of the same quote for compact placements (the review
   * page's slider). A verbatim subset of `quote`, never a paraphrase.
   */
  shortQuote?: string;
  name: string;
  role: string;
  /** Optional link to the author's public profile (LinkedIn). */
  href?: string;
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
  /**
   * Public copies of this article on other platforms (dev.to, Medium
   * publications…), each declaring this site as its canonical. Feeds the
   * article's JSON-LD `sameAs` only; never rendered. Empty when none.
   */
  syndication: string[];
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
export type ReviewSection = SectionIntro & {
  /** The scope strip on top of the card. */
  scope: { lead: string; note: string };
  steps: ReviewStep[];
};
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
};

/**
 * Option values of the hidden `format` booking field on the Cal.com event
 * type. Must match Cal's stored options exactly or the prefill silently
 * no-ops. Typed as a union so every site surface that prefills the booking
 * (the picker, `BookingLink`) is checked against the same four values.
 */
export type BookingFormatValue =
  | "live-misbehaving"
  | "live-unmeasured"
  | "pre-launch"
  | "other";

/** One row in the contact section's format picker (step 01). */
export type BookingFormat = {
  /** Two-digit index shown in the row ("01"). */
  num: string;
  title: string;
  desc: string;
  value: BookingFormatValue;
  /** Short label for the card-header chip ("Advisory"). */
  chip: string;
};

/** The Cal.com booking flow shared by every page that renders Contact. */
export type ContactBooking = {
  /** Step labels (mono, uppercase). */
  formatStep: string;
  timeStep: string;
  formats: BookingFormat[];
  /** Aside next to the email link. */
  emailHint: string;
  /** Pill over the blurred booker until a format is picked. */
  veil: string;
  /**
   * Under the pill: names the third party the pick will contact, since that
   * pick is what loads Cal (click-to-load). Keep it factual.
   */
  veilNote: string;
  /** Confirmation shown when switching format would restart a started booking. */
  restart: {
    title: string;
    body: string;
    confirm: string;
    cancel: string;
  };
  /** The section after Cal fires bookingSuccessful (design 5a). */
  confirmed: {
    label: string;
    /** Rich text. */
    title: string;
    body: string;
    /** Echo-row labels for the two answers. */
    focusLabel: string;
    weighingLabel: string;
    emailHint: string;
    timeStep: string;
    /** The site-rendered scheduled card that replaces the embed. */
    card: {
      title: string;
      body: string;
      whatLabel: string;
      whenLabel: string;
      whoLabel: string;
      whereLabel: string;
      what: string;
      where: string;
      reschedule: string;
      cancel: string;
    };
  };
  event: {
    /** Site-authored card header (Cal's own meta panel is hidden). */
    title: string;
    meta: string;
    /** Cal.com link path ("dragosbln/30min"). */
    calLink: string;
    /** Chip prefix ("Format: "). */
    chipPrefix: string;
  };
};

export type NotFound = {
  eyebrow: string;
  /** Rich text. */
  title: string;
  lede: string;
  links: NavItem[];
};

/** Copy for the article Discussion section (comments). */
export type DiscussionContent = {
  heading: string;
  namePlaceholder: string;
  bodyPlaceholder: string;
  /** Small note next to the post button ("Posted publicly. …"). */
  hint: string;
  postLabel: string;
  replyLabel: string;
  cancelLabel: string;
  /** `{name}` interpolates the parent commenter's first name. */
  replyPlaceholder: string;
  removedLabel: string;
  empty: string;
  /** Screen-reader announcement after a successful post. */
  posted: string;
  errorGeneric: string;
  errorRate: string;
  /** Remember-me / sign-in affordance. */
  signInPrompt: string;
  signInGoogle: string;
  signInGithub: string;
  /** `{name}` interpolates the remembered account name. */
  signInAs: string;
  /** `{name}` interpolates the signed-in account name. */
  postingAs: string;
  signOut: string;
  signInFailed: string;
  deleteLabel: string;
  deleteConfirm: string;
  deleteFailed: string;
  deleteNeedsSignIn: string;
  /** Comment badges. */
  badgeAuthor: string;
  badgeMember: string;
  badgeGuest: string;
  /** Warning dialog shown before an anonymous post. */
  anonTitle: string;
  anonBody: string;
  anonSignIn: string;
  anonPostAnyway: string;
  anonCancel: string;
};

/**
 * Copy for the article code-reference pane (CodePeek). `{path}`, `{start}`,
 * `{end}` and `{line}` interpolate in the dialog labels.
 */
export type CodePeekContent = {
  /** Mono eyebrow above the repo line. */
  eyebrow: string;
  /** Range slot for a reference without a line range. */
  wholeFile: string;
  openOnGithub: string;
  copyPermalink: string;
  /** Transient label after a copy. */
  copied: string;
  loadError: string;
  /** Close-button labels: desktop pane / phone sheet. */
  closePane: string;
  closeSheet: string;
  /** aria-label of the file-tabs nav. */
  filesLabel: string;
  resizeLabel: string;
  resizeHint: string;
  /** aria-labels of the round copy button (phone). */
  copyLabel: string;
  copiedLabel: string;
  /** Dialog labels. */
  rangeLabel: string;
  lineLabel: string;
};

/** One numbered block of the privacy notice. */
export type PrivacySection = {
  /** Two-digit index shown in the mono kicker ("01"). */
  num: string;
  title: string;
  /** Rich text paragraphs. */
  body: string[];
};

/**
 * /privacy page copy. Every claim here is a statement about what the code
 * actually does: change one and the other has to move with it.
 */
export type PrivacyNotice = {
  hero: PageHero;
  /** ISO date of the last substantive change, shown under the hero. */
  updated: string;
  /** Mono prefix for that date ("Last updated"). */
  updatedLabel: string;
  sections: PrivacySection[];
  /** Closing block; its email link renders from `site.email`. */
  contact: PrivacySection & { emailHint: string };
};

/* ---------- The review offer page (/review) ---------- */
/*
 * Design source: ../claude_websie/review-page-handover (one component file
 * per section). Section ids and in-page hrefs come from `anchors` in
 * src/content/review.ts so links and targets can't drift.
 */

/** A row of the landing panel's "Comes out" list; expands to one sentence and one excerpt. */
export type GlanceDeliverable = {
  /** "01" … "05" */
  num: string;
  title: string;
  /** One sentence: what it is and who it is for. */
  detail: string;
  /** One line from the worked example, set in mono on a paper-2 chip. */
  excerpt: string;
};

export type ReviewLanding = {
  /** "·"-separated; each segment wraps as a unit (as the home Hero). */
  eyebrow: string;
  title: string;
  lede: string;
  /** Plain-text page summary for <meta name="description"> and og. */
  metaDescription: string;
  /** The three doors: primary pill, ghost text link, plain underline link. */
  doors: { primary: NavItem; secondary: NavItem; tertiary: NavItem };
  panel: {
    title: string;
    goesIn: { label: string; items: { title: string; body: string }[] };
    lenses: {
      label: string;
      /** `bodyShort` replaces `body` under 480px, where two lenses share one row. */
      items: { title: string; body: string; bodyShort?: string }[];
      /** The line under the two lenses ("Each failure tied to a design decision"). */
      bridge: string;
    };
    comesOut: { label: string; items: GlanceDeliverable[] };
    /** The teal mono line at the foot of the rail ("Two to three weeks"). */
    timeline: string;
    /** Shown under the panel only while a deliverable row is open. */
    excerptNote: string;
  };
};

/** One of the three situation cards; each links to the booking step with its situation preselected. */
export type Situation = {
  /** Mono kicker ("A complaint"). */
  kicker: string;
  title: string;
  body: string;
  /** The card's own call to action, rendered with an arrow. */
  cta: string;
  /** What the card prefills in the booking picker (see `BookingLink`). */
  situation: BookingFormatValue;
};

export type SituationsSection = SectionIntro & {
  items: Situation[];
  /** The booking section, as a "/review#contact" href rendered with `BookingLink`. */
  bookingHref: string;
  covers: {
    label: string;
    items: string[];
    /** The starred line under the list. */
    note: string;
  };
  notFit: { label: string; items: string[] };
};

/** The rail's two readings; the sticky switch flips every text at once. */
export type RailReading = "happens" | "example";

/** Glyphs drawn by the rail's icon set (RailIcon); one per chip. */
export type RailChipIcon =
  | "clock"
  | "person"
  | "key"
  | "doc"
  | "file"
  | "note"
  | "rule"
  | "check"
  | "enter"
  | "play";

export type RailChip = { icon: RailChipIcon; text: string };

/** The four chip groups under an open stop, in render order. */
export type RailGroups = {
  need: RailChip[];
  see: RailChip[];
  rules: RailChip[];
  checkpoint: RailChip[];
};

export type RailStop = {
  /** "Stop 0" … "Stop 5" */
  label: string;
  /** The time, under the label ("Before", "Days 1 and 2", …). */
  when: string;
  title: string;
  happens: { summary: string; prose: string; groups: RailGroups };
  example: { summary: string; paragraphs: string[] };
};

/** The card that forks off the rail beside stops 2 and 3 ("Meanwhile"). */
export type RailBranch = {
  kicker: string;
  /** Appended to the kicker in the example reading ("· Day four"). */
  exampleKicker: string;
  title: string;
  happens: { note: string; groups: RailGroups };
  example: { note: string; paragraphs: string[] };
};

export type RailSection = SectionIntro & {
  /** Mono label before the reading switch ("Reading"). */
  readingLabel: string;
  readings: Record<RailReading, string>;
  /** Above stop 0, on the dashed lead-in. */
  pre: {
    happens: { kicker: string; items: string[] };
    example: { note: string; kicker: string; items: string[] };
  };
  stops: RailStop[];
  branch: RailBranch;
  groupLabels: Record<keyof RailGroups, string>;
  /** After stop 5, on the dashed lead-out. */
  post: {
    happens: { kicker: string; items: string[]; close: string };
    example: { kicker: string; items: string[] };
  };
};

/** The five sample documents; also the silhouette drawn on each spine. */
export type DocumentKey = "summary" | "findings" | "arch" | "roadmap" | "set";

export type DocTableColumn = {
  label: string;
  /** Mono cells (ids, counts, days). */
  mono?: boolean;
  /** The column that must not collapse (the roadmap's "Change"). */
  wide?: boolean;
};

/** A cell is plain text, or a mono id prefix + text ("R-1 Route side-effect…"). */
export type DocTableCell = string | { id: string; text: string };

export type DocCodeToken =
  | string
  | { text: string; tone: "comment" | "key" | "string" | "number" };

/**
 * The block vocabulary of a sample document page. Rendered by
 * `DocumentPage`; a `kicker` labels the block(s) that follow it.
 */
export type DocBlock =
  | { kind: "kicker"; text: string }
  /** Mono meta line under the title, separated by a hairline. */
  | { kind: "meta"; text: string }
  | { kind: "p"; text: string }
  /** Serif italic pull line (the question the client asked). */
  | { kind: "quote"; text: string }
  /** Bold answer line. */
  | { kind: "answer"; text: string }
  | { kind: "table"; columns: DocTableColumn[]; rows: DocTableCell[][] }
  | { kind: "ol"; items: string[] }
  /** Hairline-separated list. */
  | { kind: "ul"; items: string[] }
  /** Label/value rows; `boxed` draws the paper-2 box (the method block). */
  | {
      kind: "kv";
      boxed?: boolean;
      rows: { label: string; value: string; mono?: boolean }[];
    }
  /** A bordered finding card: mono id, optional serif title, inner blocks. */
  | { kind: "finding"; id: string; title?: string; blocks: DocBlock[] }
  /** Dark code block; each line is a list of tokens. */
  | { kind: "code"; lines: DocCodeToken[][] };

export type SampleDocument = {
  key: DocumentKey;
  title: string;
  /** Who it is for ("For whoever decides"): on the spine and above the page. */
  audience: string;
  blocks: DocBlock[];
  /** Page footer ("Executive summary" · "Page 1 of 3"). */
  foot?: { left: string; right: string };
};

/** A tier label over one or more spines ("What you read"). */
export type DocumentTier = { label: string; docs: DocumentKey[] };

export type DeliverablesSection = SectionIntro & {
  /** Under the head ("Pages from a worked example…"). */
  note: string;
  /** aria-label of the document picker. */
  pickerLabel: string;
  tiers: DocumentTier[];
  documents: SampleDocument[];
  /** Closing paragraph under the page. */
  close: string;
};

export type ReviewerSection = SectionIntro & {
  portrait: { src: string; alt: string };
  /** Mono lines under the name ("Cluj-Napoca, RO", "Remote · EU/US"). */
  location: string[];
  /** Rows of links separated by a middle dot ([work, writing], [LinkedIn, CV]). */
  links: NavItem[][];
  /** Two paragraphs. */
  bio: string[];
  depthLabel: string;
  depth: string[];
  /** The testimonial slider; quotes come from `testimonials` in site.ts. */
  slider: {
    label: string;
    /** aria-labels: the dots group, prev/next buttons. */
    chooseLabel: string;
    prevLabel: string;
    nextLabel: string;
    /** `{n}`, `{total}`, `{name}` interpolate ("Review 1 of 3, Shilpi Reddy"). */
    reviewLabel: string;
  };
};

export type FirstReadSection = SectionIntro & {
  lede: string;
  waysLabel: string;
  /** Rich text: the time it costs is **bold** inside the sentence. */
  ways: { letter: string; body: string }[];
  /** Primary button opening a prefilled mailto (site.email). */
  cta: { label: string; subject: string; body: string };
  /** The sub-page link; absent until /review/first-read exists. */
  guide?: NavItem;
  notLabel: string;
  not: string;
};

export type Question = {
  /** "01" … "14" */
  num: string;
  q: string;
  a: string;
};

export type QuestionsSection = SectionIntro & {
  items: Question[];
  /** How many rows show before the "more" row. */
  visibleCount: number;
  /** The "more" row's label ("Nine more questions"). */
  moreLabel: string;
};
