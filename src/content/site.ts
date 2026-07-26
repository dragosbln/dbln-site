import type {
  AgenticSection,
  Contact,
  ContactBooking,
  DiscussionContent,
  Hero,
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
  title: "Dragos Bilaniuc — Independent AI Reliability Reviews",
  description:
    "I find where AI products break, and the design decisions that let it break. Independent reviews of LLM products: verified findings, architecture review, system-level fix plan.",
  email: "dragos@dbln.me",
  location: "Cluj-Napoca, Romania",
  /** Structured halves of `location`, for the Person schema's PostalAddress. */
  locality: "Cluj-Napoca",
  countryCode: "RO",
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

/** Hrefs are "/#…" (not "#…") so they work from future non-home pages too. */
export const nav: { links: NavItem[]; cta: NavItem } = {
  links: [
    { label: "The review", href: "/#review" },
    { label: "Work", href: "/#work" },
    { label: "Writing", href: "/#writing" },
  ],
  cta: { label: "Book a call", href: "/#contact" },
};

export const hero: Hero = {
  eyebrow: "AI Reliability · Independent reviews of LLM products · Software Architecture & Development",
  title:
    "I find where your AI product breaks, and *the design decisions* that let it break.",
  lede: "Independent reviews for teams whose LLM feature is live but unmeasured. I reproduce failures from your real outputs, review the architecture around the model, and trace each one to the design decision behind it. Anything I can't verify stays out of the report.",
  actions: {
    primary: { label: "Book a call", href: "/#contact" },
    secondary: { label: "See selected work", href: "/#work" },
  },
  meta: [
    { key: "Based", value: "Cluj-Napoca, RO", detail: "Remote · EU / US" },
    {
      key: "Technologies",
      value: "LLMs · TypeScript · Node.js",
      detail: "Next.js · AWS · GCP",
    },
    {
      key: "Depth",
      value: "AI Systems Design · Architecture · Security",
      detail: "Microservices · DDD · Event-Driven · CI/CD",
    },
  ],
};

export const work: WorkSection = {
  num: "03",
  title: "Selected work",
  aside: "The work behind the reviews: where the architectural and engineering depth comes from.",
  asideLink: { label: "Read more case studies", href: "/work" },
  cta: { label: "Read more case studies", href: "/work" },
  items: [
    {
      period: "2026",
      title: "Verification-first AI audit tool",
      role: "Architect & Author · Open source",
      body: "An open-source audit skill that reviews a codebase's auth layer for vendor lock-in risk. AI does the reading; every finding is quoted from the code and **verified against live runs**, and the harness that tests the auditor is **mutation-tested**. The method behind my reviews, working in public.",
      tags: ["AI-assisted audit", "Verified evidence", "Mutation testing", "Open source"],
    },
    {
      period: "2024—25",
      title: "Backend for an AI-agents platform",
      role: "Lead Backend Architect · Bullseye Web3 Studio",
      body: "Architected the event-driven microservices backend behind two greenfield products, including A1X, a platform where users create and run their own AI agents. Zero to **150,000+ registered users**; GCP stayed **under $500/month** across 10+ services, mostly by deciding what not to build before product-market fit.",
      tags: ["AI agents", "Microservices", "GCP", "Cost efficiency"],
    },
    {
      period: "2020—25",
      title: "LLM chatbot in a health product",
      role: "Fractional CTO · Parentool",
      body: "Shipped a production LLM chatbot (OpenAI, structured outputs) inside a health-tech product I ran end to end: **10,000+ users**, **7% paid conversion**, peak at **#3 in App Store Health & Fitness**. A domain where wrong answers carry real cost.",
      tags: ["LLM chatbot", "OpenAI", "Fractional CTO", "0→1"],
    },
    {
      period: "2025—26",
      title: "Auth system re-architecture",
      role: "Lead Architect & Engineer · Pie Insurance",
      body: "Owned the authentication track of a unified frontend re-architecture across a Partner Portal of **100+ backend microservices**. Wrote the ADRs (framework, token storage, OAuth, multi-pool Cognito) and migrated the legacy Amplify/SRP auth to a modern OAuth flow on Cognito Managed Login.",
      tags: ["Cognito", "OAuth", "Managed Login", "ADRs", "Multi-pool"],
    },
  ],
};

/** Landing section 01 (design: engagements-3a): the single lead offer. */
export const review: ReviewSection = {
  num: "01",
  title: "The AI Reliability Review",
  scope: {
    lead: "Fixed scope, two weeks.",
    note: "+1–3 days if you don't have tracing yet.",
  },
  steps: [
    {
      eyebrow: "01 · You provide",
      lead: "Three inputs:",
      items: [
        "Repo access",
        "A slice of real outputs *— or a way to generate them*",
        "2–3 hours of team time",
      ],
    },
    {
      eyebrow: "02 · I review",
      lead: "Both sides of the system:",
      items: [
        "**Behavior** *— failures in your real outputs, reproduced and counted*",
        "**Design** *— the architecture around the model: data flow, retrieval, prompts, fallbacks*",
        "**The trace** *— each failure tied to the design decision behind it*",
      ],
    },
    {
      eyebrow: "03 · You leave with",
      lead: "Five deliverables:",
      ordered: true,
      items: [
        "Failure inventory",
        "Architecture findings",
        "Ranked fix roadmap",
        "Starter regression set",
        "Executive readout",
      ],
    },
  ],
};

export const testimonials: TestimonialsSection = {
  num: "04",
  title: "What teams say",
  aside: "From the people who hired me: enterprise leads, founders, clients.",
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

export const agentic: AgenticSection = {
  num: "02",
  title: "The method",
  aside: "How AI fits in the work, and why the findings hold.",
  pull: "I use AI heavily in every review: it reads more outputs, tries more angles, and covers more of the system than I could alone. But *the judgment doesn't get outsourced, and neither does the verification.* Every finding is reproduced by hand before it reaches the report.",
  items: [
    {
      kicker: "Search",
      title: "AI-accelerated analysis",
      body: "AI reads more of your outputs and your codebase than a human reviewer could. It surfaces candidates: possible failures, suspect paths, patterns worth a look.",
    },
    {
      kicker: "Verify",
      title: "Candidates become findings",
      body: "AI-assisted analysis produces findings that are plausible and wrong. So a candidate becomes a finding only when I reproduce it and trace it to a cause. What I can't verify doesn't ship.",
    },
    {
      kicker: "Evidence",
      title: "Findings you can re-run",
      body: "Each finding carries its trace and its reproduction steps. Your team can check my work without me in the room.",
    },
    {
      kicker: "Design",
      title: "Down to the decision",
      body: "Failures get traced to the design decision that allowed them: retrieval, data flow, fallbacks, orchestration. The fix plan changes the system, and the regression set keeps it honest.",
    },
  ],
};

// Articles themselves live in src/content/posts/*.md; the landing section
// shows the newest `featuredCount` of them (src/lib/posts.ts).
export const writing: WritingSection = {
  num: "05",
  title: "Writing",
  aside: "Notes from production work, written up in full.",
  asideLink: { label: "Read the blog", href: "/blog" },
  featuredCount: 3,
};

export const contact: Contact = {
  label: "Book a call",
  title: "Ready to find out where your AI product *breaks?*",
  body: "Pick your situation, pick a time. The intro call is 30 minutes.",
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
