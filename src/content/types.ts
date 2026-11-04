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

/** The home hero's profile aside; the portrait is `site.portrait`, the name `site.name`. */
export type HeroProfile = {
  /** aria-label of the aside ("About Dragos"). */
  label: string;
  /** Under the name ("Software engineer & architect"). */
  role: string;
  bio: string;
  /** The personal line ("I run every review myself…"). */
  commitment: string;
  /** Foot line ("Cluj-Napoca, Romania · Remote"). */
  location: string;
  /** Foot links: a section of this site, or a profile (opens in a new tab). */
  links: NavItem[];
};

export type Hero = {
  eyebrow: string;
  /** Rich text. */
  title: string;
  lede: string;
  /** The one call to action; leads to the booking section. */
  cta: NavItem;
  profile: HeroProfile;
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

/** The home review section's engagement panel: three steps on one rail. */
export type EngagementPanel = {
  title: string;
  bring: { label: string; text: string };
  /** The two lenses, set side by side in serif. */
  lenses: { label: string; items: string[] };
  receive: {
    label: string;
    /** aria-label of the deliverables list. */
    listLabel: string;
    items: string[];
  };
  /** The teal mono line at the rail's end: "Fixed scope · Two to three weeks". */
  scope: string;
  duration: string;
};

/**
 * A context the review is read in. Links to that context's page; until the
 * page exists, to the booking section, with `ariaLabel` naming the action.
 */
export type ReviewContextItem = {
  name: string;
  desc: string;
  href: string;
  ariaLabel?: string;
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
  panel: EngagementPanel;
  context: { label: string; items: ReviewContextItem[] };
};
export type TestimonialsSection = SectionIntro & { items: Testimonial[] };
export type WritingSection = SectionIntro & {
  /** One line under the head ("Research and practical work on…"). */
  intro: string;
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
 * A booking band without the situation picker (`BookingBand`): one button
 * loads Cal.com (click-to-load, AGENTS.md "Contact booking"). The home page
 * and the customer-operations review page each have one; the event itself
 * is `booking.event`.
 */
export type BookingBandContent = {
  label: string;
  /** Rich text. */
  title: string;
  body: string;
  /** The small line under the body ("No preparation or system access needed."). */
  prep: string;
  /** Above the email link. */
  mailPrompt: string;
  card: {
    /** Site-authored header, shown until Cal's own event details load. */
    title: string;
    meta: string;
    /** The click-to-load button. */
    button: string;
    /** Under the button: names the third party the click will contact. */
    note: string;
    privacyLabel: string;
    /** Status line while the booker loads. */
    loading: string;
    /** Status after the slow-load timeout, before the email fallback link. */
    slow: string;
    /** Status when the embed cannot load, before the email fallback link. */
    failed: string;
    emailFallback: string;
    /** aria-label of the calendar region. */
    slotLabel: string;
    /** title of the booker iframe once it has loaded. */
    iframeTitle: string;
  };
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
  /** How many rows show before the "more" row; absent, every row shows. */
  visibleCount?: number;
  /** The "more" row's label ("Nine more questions"). */
  moreLabel?: string;
};

/* ---------- The customer-operations review page (/customer-operations-review) ---------- */
/*
 * Design source: the approved customer-operations reference page
 * (dbln-review-customer-operations.html, 2026-11-03). Section ids and
 * in-page hrefs come from `anchors` in src/content/customerOperations.ts.
 */

/** A row of the hero panel's "Comes out" list: number, title, format. */
export type GlanceRow = { num: string; title: string; format: string };

export type CustomerOperationsHero = {
  eyebrow: string;
  /** Rich text: the emphasised close ("*handle next*"). */
  title: string;
  lede: string;
  /** Plain-text name of the offer for <title>, the breadcrumb and the Service schema. */
  pageTitle: string;
  /** Plain-text page summary for <meta name="description"> and og. */
  metaDescription: string;
  /** The two doors: primary pill, ghost text link. */
  doors: { primary: NavItem; secondary: NavItem };
  panel: {
    title: string;
    goesIn: { label: string; items: { title: string; body: string }[] };
    lenses: {
      label: string;
      items: { title: string; body: string }[];
      /** The line under the two lenses ("Trace the behavior back to the system."). */
      bridge: string;
    };
    comesOut: { label: string; items: GlanceRow[] };
    /** The teal mono line at the foot of the rail ("Two to three weeks"). */
    timeline: string;
  };
};

/** The three panels of the story illustration sprite, left to right. */
export type StoryArt = "team" | "pattern" | "conditions";

type StoryCardBase = {
  /** For the live status line ("Showing the doubt."). */
  name: string;
  /** aria-label of the card ("Step 1 of 3: the doubt"). */
  ariaLabel: string;
  /** Teal uppercase label ("THE TRIGGER", "01 · THE DOUBT"). */
  label: string;
  title: string;
};

/** A card of the horizontal review story: the narrow trigger, or an illustrated step. */
export type StoryCard =
  | (StoryCardBase & { kind: "trigger" })
  | (StoryCardBase & {
      kind: "step";
      art: StoryArt;
      /** aria-label of the illustration. */
      artAlt: string;
      /** The paragraph that flows around the illustration with the title. */
      lead: string;
      body?: string;
      /** The serif pull line in the wash box (step 2). */
      finding?: string;
      /** Rich text: the small line after the finding ("**Also found:** …"). */
      more?: string;
    });

export type StorySection = SectionIntro & {
  /** The Back/Next controls: the nav's aria-label and the two button labels. */
  nav: { label: string; back: string; next: string };
  /** aria-label of the scrolling region. */
  railLabel: string;
  /** Live status line; `{name}` interpolates the settled card's `name`. */
  status: string;
  cards: StoryCard[];
};

export type ProcessStep = {
  /** "0" … "6"; also the list's start number. */
  num: string;
  name: string;
  /** Right-aligned time indicator ("Days 1–2"). */
  timing: string;
  summary: string;
  prose: string;
  team: string;
  checkpoint: string;
};

export type ProcessPhase = {
  title: string;
  note: string;
  steps: ProcessStep[];
  /** Rich text: the wash line under the phase ("**If something critical turns up:** …"). */
  critical?: string;
};

export type ProcessSection = SectionIntro & {
  /** The two dt labels of every step's detail. */
  meta: { team: string; checkpoint: string };
  phases: ProcessPhase[];
};

export type DeliverableKey = "summary" | "findings" | "design" | "roadmap" | "checks";

/** The three rollout-gate files of the checks editor. */
export type CheckCaseKey = "retry" | "cap" | "status";

/** An inline cross-reference ("(G01)") that opens another deliverable, and a gate file in it. */
export type XRef = { label: string; go: DeliverableKey; caseKey?: CheckCaseKey };

/** Text with inline cross-references. */
export type RefText = (string | XRef)[];

export type LabelledValue = { label: string; value: RefText };

export type Deliverable = {
  key: DeliverableKey;
  title: string;
  /** Shorter title for the picker, when the full one is long. */
  navTitle?: string;
  format: string;
  purpose: string;
};

export type CheckLine = { tone?: "comment" | "key" | "string"; text: string };

export type CheckCase = {
  key: CheckCaseKey;
  filename: string;
  lines: CheckLine[];
  /** The failing run's title ("G01 · Duplicate payment") and its detail. */
  failure: string;
  expected: string;
};

/** The texts of the design finding's architecture diagram; the geometry is the component's. */
export type ArchitectureLabels = {
  alt: string;
  runtime: string;
  service: string;
  tool: string;
  faultFrom: string;
  faultTo: string;
  store: [string, string];
  api: string;
  apiMeta: string;
};

export type DeliverablesBrowser = SectionIntro & {
  /** aria-label of the deliverable picker. */
  pickerLabel: string;
  items: Deliverable[];
  summary: { label: string; heading: string; bullets: RefText[]; bottom: string };
  findings: { label: string; heading: string; body: string; evidence: LabelledValue[] };
  design: {
    label: string;
    heading: string;
    body: string;
    columns: LabelledValue[];
    diagram: ArchitectureLabels;
  };
  roadmap: {
    step: { label: string; heading: string; body: string; meta: LabelledValue[] };
    /** The collapsed later items. */
    next: string[];
  };
  checks: {
    /** aria-label of the file list. */
    filesLabel: string;
    folders: { gates: string; regression: string; fixtures: string };
    /** Before the open file's name ("gates / "). */
    openPrefix: string;
    cases: CheckCase[];
    regression: string[];
    fixtures: string[];
    terminal: { command: string; runs: { status: "pass" | "fail"; text: string }[] };
    note: string;
  };
};

export type ReviewerCard = SectionIntro & {
  /** Under the name; the name and portrait are `site.name` / `site.portrait`. */
  role: string;
  location: string;
  bio: string[];
  commitment: string;
  /** A profile (new tab) or a page of this site. */
  links: NavItem[];
  testimonial: {
    label: string;
    /** A verbatim cut of a quote in `testimonials` (site.ts). */
    quote: string;
    name: string;
    role: string;
    href?: string;
  };
  writing: {
    label: string;
    all: NavItem;
    articles: { title: string; desc: string; href: string }[];
  };
};
