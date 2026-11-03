import type {
  CodePeekContent,
  Contact,
  ContactBooking,
  DiscussionContent,
  Hero,
  HomeBooking,
  NavItem,
  NotFound,
  ReviewSection,
  TestimonialsSection,
  WorkSection,
  WritingSection,
} from "./types";

/**
 * Single source of truth for site-wide content and identity.
 * Components render this content; they must not contain copy of their own.
 * Inline emphasis: **text** -> <strong>, *text* -> <em> (src/lib/richText.tsx).
 */

export const site = {
  url: "https://dbln.me",
  name: "Dragos Bilaniuc",
  company: "Luckylabs Software SRL",
  /** Short brand form, e.g. the header's "/ Luckylabs". */
  companyShort: "Luckylabs",
  role: "Independent AI Reliability Reviews · Software Architect",
  title: "Dragos Bilaniuc · AI reliability & system design",
  description:
    "Independent reviews of AI workflows, grounded in agent behaviour and system design. Evidence, priorities and runnable checks for your next rollout.",
  email: "dragos@dbln.me",
  location: "Cluj-Napoca, Romania",
  /** Structured halves of `location`, for the Person schema's PostalAddress. */
  locality: "Cluj-Napoca",
  countryCode: "RO",
  /** The portrait in public/: the home hero and the review page's reviewer card. */
  portrait: "/images/dragos-640.jpg",
  socials: {
    devto: "https://dev.to/dragosbln",
    github: "https://github.com/dragosbln",
    linkedin: "https://www.linkedin.com/in/dragosbln",
    x: "https://twitter.com/dragosbln",
  },
} as const;

/** Ordered social links for display (schema.ts reads site.socials directly). */
export const socialLinks: NavItem[] = [
  { label: "dev.to", href: site.socials.devto },
  { label: "github", href: site.socials.github },
  { label: "linkedin", href: site.socials.linkedin },
  { label: "x", href: site.socials.x },
];

/**
 * Hrefs are "/#…" (not "#…") so they work from non-home pages too. Render
 * them with `HashLink`, which relativizes them on the page they target.
 */
export const nav: { links: NavItem[]; cta: NavItem } = {
  links: [
    { label: "The review", href: "/#review" },
    { label: "Work", href: "/#work" },
    { label: "Writing", href: "/#writing" },
  ],
  cta: { label: "Book a call", href: "/#contact" },
};

/** The home hero (design: the approved homepage of 2026-11-02): one CTA, the profile aside. */
export const hero: Hero = {
  eyebrow: "AI reliability & system design",
  title: "I help teams establish what their AI is ready to *handle next.*",
  lede: "Independent reviews for teams preparing to release or expand AI workflows. I examine agent behaviour and system design to establish what needs to change and how to verify it.",
  cta: { label: "Let's discuss your next rollout", href: "/#contact" },
  profile: {
    label: "About Dragos",
    role: "Software engineer & architect",
    bio: "Over nine years in software delivery, across engineering, architecture and technical leadership.",
    commitment: "I run every review myself, from the first conversation to the handoff.",
    location: "Cluj-Napoca, Romania · Remote",
    links: [
      { label: "Selected work", href: "/#work" },
      { label: "LinkedIn", href: site.socials.linkedin },
    ],
  },
};

export const work: WorkSection = {
  num: "02",
  title: "Selected work",
  aside: "Experience in architecture and delivery.",
  asideLink: { label: "Explore the case studies", href: "/work" },
  cta: { label: "Explore the case studies", href: "/work" },
  items: [
    {
      period: "2025–26",
      title: "Authentication re-architecture",
      role: "Senior Software Engineer · Pie Insurance",
      body: "Owned the authentication track of a unified frontend re-architecture for a Partner Portal backed by **100+ microservices**. Wrote the architecture decisions and migrated the legacy Amplify/SRP flow to OAuth on Cognito Managed Login.",
      tags: ["Cognito", "OAuth", "Managed Login", "ADRs", "Multi-pool"],
    },
    {
      period: "2024–25",
      title: "Backend architecture for two new products",
      role: "Lead Backend Architect & Developer · Bullseye Web3 Studio",
      body: "Architected and led the backend for two products, including A1X, a platform for creating and running AI agents. The work supported **150,000+ registered users**, with GCP costs under **$500/month** across 10+ services.",
      tags: ["AI agents", "Microservices", "GCP", "Cost efficiency"],
    },
    {
      period: "2020–25",
      title: "Technical leadership from idea to production",
      role: "Fractional CTO · Parentool",
      body: "Owned architecture and delivery for a health-tech product, including a production LLM chatbot. The product reached **10,000+ users** and peaked at **#3 in App Store Health & Fitness**.",
      tags: ["LLM chatbot", "OpenAI", "Fractional CTO", "0→1"],
    },
  ],
};

/**
 * Landing section 01: the engagement at a glance, beside the contexts the
 * review is read in. Each context links to its own page once that page
 * exists; until then it leads to the booking section, as Finance does.
 */
export const review: ReviewSection = {
  num: "01",
  title: "The AI Reliability Review",
  panel: {
    title: "The engagement, at a glance",
    bring: {
      label: "You bring",
      text: "One workflow and the next rollout decision.",
    },
    lenses: {
      label: "I review",
      items: ["Agent behaviour", "System design"],
    },
    receive: {
      label: "You receive",
      listLabel: "Review deliverables",
      items: ["Findings", "Roadmap", "Runnable checks"],
    },
    scope: "Fixed scope",
    duration: "Two to three weeks",
  },
  context: {
    label: "Review in context",
    items: [
      // TODO(customer-relations): the design links a dedicated customer
      // relations review page, not built yet. Flip `href` to it (and drop
      // `ariaLabel`) once it exists; nothing else changes.
      {
        name: "Customer relations",
        desc: "Customer-service agents, actions and handoffs.",
        href: "/#contact",
        ariaLabel: "Discuss a customer relations workflow",
      },
      {
        name: "Finance",
        desc: "Invoices, payments and financial records.",
        href: "/#contact",
        ariaLabel: "Discuss a finance workflow",
      },
    ],
  },
};

export const testimonials: TestimonialsSection = {
  num: "03",
  title: "What teams say",
  aside: "From the people I’ve worked with.",
  items: [
    {
      quote:
        "Before diving into the code, he takes the time to thoroughly understand the business requirements — that meticulous upfront analysis lets him anticipate complex edge cases and architectural roadblocks long before they reach production. He has the rare maturity to provide constructive pushback when necessary.",
      name: "Shilpi Reddy",
      role: "Engineering Leader · Pie Insurance",
      href: "https://www.linkedin.com/in/shilpi-reddyreddy-942408a/",
    },
    {
      quote:
        "He helped me transform my initial concepts into clear, structured documentation and provided insights that added real value to the project. What impressed me most was his ability to communicate technical concepts in a way that was accessible to everyone, ensuring alignment across the board. A consummate professional.",
      shortQuote:
        "What impressed me most was his ability to communicate technical concepts in a way that was accessible to everyone, ensuring alignment across the board. A consummate professional.",
      name: "Emin Eskiocak",
      role: "PropTech Entrepreneur",
      href: "https://www.linkedin.com/in/emineskiocak/",
    },
    {
      quote:
        "He delivered a highly functional, almost bugless solution in the exact timeline we agreed — and could explain to us, non-technical people, everything happening in the backend.",
      name: "Petruța Costea",
      role: "Founder · Parentool",
      href: "https://www.linkedin.com/in/petru%C8%9Ba-%C8%9Bulig%C4%83/",
    },
  ],
};

// Articles themselves live in src/content/posts/*.md; the landing section
// shows the newest `featuredCount` of them (src/lib/posts.ts).
export const writing: WritingSection = {
  num: "04",
  title: "Writing",
  asideLink: { label: "Read the blog", href: "/blog" },
  intro: "Research and practical work on AI reliability and system design.",
  featuredCount: 3,
};

/** The booking band on /review and /work (`Contact` + `BookingFlow`). */
export const contact: Contact = {
  label: "Book a call",
  title: "Ready to find out where your AI product *breaks?*",
  body: "Pick your situation, pick a time. The intro call is 30 minutes.",
};

/**
 * The home page's booking band (`pages/home/Booking`): one button loads the
 * Cal.com calendar; the event is `booking.event` below.
 */
export const homeBooking: HomeBooking = {
  label: "Let’s talk",
  title: "What do you want your agent to *handle next?*",
  body: "Let’s discuss your AI workflow, what your team is preparing to change, and where confidence is missing. We’ll work out whether a review would help and what it should focus on.",
  prep: "No preparation or system access needed.",
  mailPrompt: "Prefer email? Send me a sentence about the workflow.",
  card: {
    title: "Discuss your AI workflow",
    meta: "30 min · Google Meet",
    button: "Show available times",
    note: "The calendar loads from Cal.com when you click.",
    privacyLabel: "Privacy notice",
    loading: "Loading available times…",
    slow: "The calendar is taking longer than expected.",
    failed: "The calendar couldn’t load.",
    emailFallback: "Arrange a time by email.",
    slotLabel: "Choose a time with Dragos",
    iframeTitle: "Book a 30-minute conversation with Dragos",
  },
};

/**
 * Discussion (comments) copy. Taken from the blog-social design where it
 * exists; `hint` replaces the prototype's "Stored in your browser. Be
 * decent." (comments are no longer browser-local) — DRAFT for Dragos.
 */
export const discussion: DiscussionContent = {
  heading: "Discussion",
  namePlaceholder: "Your name",
  bodyPlaceholder:
    "Add to the discussion — push back, ask, or share where you've seen this play out.",
  hint: "Posted publicly. Be decent.",
  postLabel: "Post comment",
  replyLabel: "Reply",
  cancelLabel: "Cancel",
  replyPlaceholder: "Reply to {name}…",
  removedLabel: "Comment removed",
  empty: "No comments yet — start the discussion.",
  posted: "Posted.",
  errorGeneric: "That didn't post. Try again in a moment.",
  errorRate: "Too fast. Give it a few seconds.",
  signInPrompt: "Want to keep and manage your comments? Sign in.",
  signInGoogle: "Google",
  signInGithub: "GitHub",
  signInAs: "Sign in as {name}",
  postingAs: "Posting as {name}",
  signOut: "Sign out",
  signInFailed: "Sign-in didn't finish. You can still comment as a guest.",
  deleteLabel: "Delete",
  deleteConfirm: "Delete your comment?",
  deleteFailed: "Couldn't delete that. Try again.",
  deleteNeedsSignIn: "Sign in first. This comment belongs to your account.",
  badgeAuthor: "Author",
  badgeMember: "Signed in",
  badgeGuest: "Guest",
  anonTitle: "Post as a guest?",
  anonBody:
    "You are not signed in. A guest comment can't be edited or deleted later, and it isn't tied to you. Sign in to keep and manage it.",
  anonSignIn: "Sign in",
  anonPostAnyway: "Post as guest",
  anonCancel: "Cancel",
};

/**
 * The code-reference pane on articles (design: claude_websie/blog-social/
 * code-peek.js, `COPY`; spec in claude_websie/design_handoff_code_peek).
 */
export const codePeek: CodePeekContent = {
  eyebrow: "Referenced in this article",
  wholeFile: "whole file",
  openOnGithub: "Open on GitHub",
  copyPermalink: "copy permalink",
  copied: "copied",
  loadError: "Couldn't load this file",
  closePane: "Close pane",
  closeSheet: "Close",
  filesLabel: "Files",
  resizeLabel: "Resize pane",
  resizeHint: "Drag to resize · double-click to reset",
  copyLabel: "Copy permalink",
  copiedLabel: "Link copied",
  rangeLabel: "{path}, lines {start} to {end}",
  lineLabel: "{path}, line {line}",
};

/**
 * The Cal.com booking flow (direction 3a in claude_websie/directions/brief.html),
 * shared by every page that renders Contact. `value` strings are the option
 * values of the hidden `format` booking field on the Cal event type; they must
 * match Cal's configuration exactly or the prefill silently no-ops. The
 * "What are you weighing?" question lives inside Cal's own booking form.
 */
export const booking: ContactBooking = {
  formatStep: "01 · Where are you with your AI feature?",
  timeStep: "02 · Pick a time",
  formats: [
    {
      num: "01",
      title: "Live, and misbehaving",
      desc: "Users or support are flagging it.",
      value: "live-misbehaving",
      chip: "Misbehaving",
    },
    {
      num: "02",
      title: "Live, but unmeasured",
      desc: "Nobody can say how often it fails.",
      value: "live-unmeasured",
      chip: "Unmeasured",
    },
    {
      num: "03",
      title: "Not shipped yet",
      desc: "You want it reviewed before launch.",
      value: "pre-launch",
      chip: "Pre-launch",
    },
    {
      num: "04",
      title: "Something else",
      desc: "Architecture, CTO work, or not sure.",
      value: "other",
      chip: "Other",
    },
  ],
  emailHint: "Prefer email? That works too.",
  veil: "Pick your situation to open the calendar",
  veilNote: "The calendar loads from Cal.com.",
  restart: {
    title: "Switch your situation?",
    body: "Switching restarts the booking. Anything you entered is lost.",
    confirm: "Switch",
    cancel: "Keep booking",
  },
  confirmed: {
    label: "You're on the calendar",
    title: "Talk soon. The *invite is in your inbox.*",
    body: "The details are on the right and in your calendar invitation. Bring what you're seeing: the complaints, the odd outputs, the thing you can't measure. If something shifts, the invite has the links to move or cancel it.",
    focusLabel: "Focus",
    weighingLabel: "Weighing",
    emailHint: "Something to send ahead? Email works.",
    timeStep: "02 · Scheduled",
    card: {
      title: "This meeting is scheduled",
      body: "A calendar invitation with all the details went to your email.",
      whatLabel: "What",
      whenLabel: "When",
      whoLabel: "Who",
      whereLabel: "Where",
      what: "Intro call · 30 min",
      where: "Google Meet",
      reschedule: "Reschedule",
      cancel: "Cancel",
    },
  },
  event: {
    title: "Intro call",
    meta: "30 min · Google Meet",
    calLink: "dragosbln/30min",
    chipPrefix: "Situation: ",
  },
};

/** /404 page copy (src/app/not-found.tsx). */
export const notFound: NotFound = {
  eyebrow: "Error · 404",
  title: "That page *isn't here.*",
  lede: "The URL is wrong, the page has moved, or it was never real. Head back to the front, or pick one of these.",
  links: [
    { label: "Home", href: "/" },
    { label: "Selected work", href: "/work" },
    { label: "Writing", href: "/blog" },
  ],
};
