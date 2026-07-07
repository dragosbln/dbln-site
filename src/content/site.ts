import type {
  AgenticSection,
  Contact,
  EngagementsSection,
  Hero,
  NavItem,
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
  role: "Independent Software Architect & Fractional CTO",
  title: "Dragos Bilaniuc — Independent Software Architect & Fractional CTO",
  description:
    "I help teams get the expensive-to-reverse decisions right, then build them. Eight years of architecture and platform work across insurance, Web3 and health-tech: auth, data, system boundaries.",
  email: "hello@dbln.me",
  location: "Cluj-Napoca, Romania",
  socials: {
    devto: "https://dev.to/dragosbln",
    github: "https://github.com/dragosbln",
    linkedin: "https://www.linkedin.com/in/dragosbln",
    x: "https://twitter.com/dragosbln",
  },
} as const;

export type Site = typeof site;

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
    { label: "Work", href: "/#work" },
    { label: "Engagements", href: "/#engage" },
    { label: "Writing", href: "/#writing" },
  ],
  cta: { label: "Start a conversation", href: "/#contact" },
};

export const hero: Hero = {
  eyebrow: "Independent Software Architect · Fractional CTO",
  title:
    "I help teams get the *expensive-to-reverse* decisions right, then build them.",
  lede: "Eight years of architecture and platform work across insurance, Web3 and health-tech. I'm hired for judgment on the calls that are hard to undo: auth, data, system boundaries. And for the engineering to ship them.",
  actions: {
    primary: { label: "Start a conversation", href: "/#contact" },
    secondary: { label: "See selected work", href: "/#work" },
  },
  meta: [
    { key: "Based", value: "Cluj-Napoca, RO", detail: "Remote · EU / US" },
    {
      key: "Core stack",
      value: "TypeScript · Node · Next",
      detail: "AWS · GCP · Postgres",
    },
    {
      key: "Depth",
      value: "Architecture · Auth · Security",
      detail: "Event-driven · DDD · Modernization",
    },
  ],
};

// TODO(work): when the /work case-studies page ships, link the aside
// ("Full case studies") and add a "Read all six case studies" CTA below the
// list — see claude_websie/directions/brief.html for the intended markup.
export const work: WorkSection = {
  num: "01",
  title: "Selected work",
  aside: "A few engagements where the decision mattered more than the keystrokes.",
  items: [
    {
      period: "2025—26",
      title: "Auth system re-architecture",
      role: "Lead Architect & Engineer · Pie Insurance",
      body: "Owned the authentication track of a unified frontend re-architecture across a Partner Portal of **100+ backend microservices**. Wrote the ADRs (framework, token storage, OAuth, multi-pool Cognito) and migrated the legacy Amplify/SRP auth to a modern OAuth flow on Cognito Managed Login.",
      tags: ["Cognito", "OAuth", "Managed Login", "ADRs", "Multi-pool"],
    },
    {
      period: "2025",
      title: "Notifications & self-serve documents",
      role: "System Design · Pie Insurance",
      body: "Designed a generic notification system that works with **100+ services**, and shipped a self-serve document-generation feature that cut manual support load by **roughly 80%**.",
      tags: ["Event-driven", "AWS", "Platform"],
    },
    {
      period: "2024—25",
      title: "Event-driven microservices backend",
      role: "Lead Backend Architect · Bullseye Web3 Studio",
      body: "Architected and led the event-driven microservices backend for two greenfield Web3 products, from zero to **150,000+ registered users**. GCP stayed **under $500/month** across 10+ services, mostly by deciding what not to build before product-market fit.",
      tags: ["Microservices", "GCP", "Event-driven", "Cost efficiency"],
    },
    {
      period: "2020—25",
      title: "Healthtech, zero to one",
      role: "Fractional CTO · Parentool",
      body: "Took a health-tech product from idea to **10,000+ users** and **7% paid conversion**. Peaked at **#3 in App Store Health & Fitness**. Owned stack, team and delivery end to end.",
      tags: ["Fractional CTO", "React Native", "Firebase", "0→1"],
    },
  ],
};

export const engagements: EngagementsSection = {
  num: "02",
  title: "How I engage",
  aside:
    "I sell engagement formats, not job titles. Each one is scoped around the decisions you're trying to get right.",
  items: [
    {
      id: "A",
      title: "Architecture Advisory",
      body: "Reviews of your system, infrastructure or roadmap, on retainer or per engagement: boundaries, auth, data, cloud spend, modernization paths.",
      when: "Best before an expensive-to-reverse call",
      scope: "System redesigns · auth & data · modernization",
    },
    {
      id: "B",
      title: "Fractional CTO & Tech Lead",
      body: "Senior technical judgment for early-stage teams that need direction, hiring signal and architectural ownership, without the full-time hire.",
      when: "For teams scaling past their first decisions",
      scope: "0→1 · technical direction · team building",
    },
    {
      id: "C",
      title: "Hands-on Senior Engineering",
      body: "For complex initiatives that need someone who can design and build: re-architectures, platform builds, modernizations.",
      when: "When design and delivery can't be separated",
      scope: "Re-architecture · platform · auth & security",
    },
  ],
};

export const testimonials: TestimonialsSection = {
  num: "03",
  title: "What teams say",
  aside: "From the people who hired me: enterprise leads, founders, clients.",
  items: [
    {
      quote:
        "Before diving into the code, he takes the time to thoroughly understand the business requirements — that meticulous upfront analysis lets him anticipate complex edge cases and architectural roadblocks long before they reach production. He has the rare maturity to provide constructive pushback when necessary.",
      name: "Shilpi Reddy",
      role: "Engineering Leader · Pie Insurance",
    },
    {
      quote:
        "One of those valuable developers you'd want to build your team around. A pragmatic problem solver, keen to improve code and product quality while always keeping the user in mind.",
      name: "Sebastiaan Ordelman",
      role: "Product Director & CTO",
    },
    {
      quote:
        "He delivered a highly functional, almost bugless solution in the exact timeline we agreed — and could explain to us, non-technical people, everything happening in the backend.",
      name: "Petruța Costea",
      role: "Founder · Parentool",
    },
  ],
};

export const agentic: AgenticSection = {
  num: "04",
  title: "On agentic development",
  aside: "Where the real work is now that the typing is cheap.",
  pull: "I use agentic tools, mostly Claude Code, daily on production work. Scaffolding, refactors and exploratory design are nearly free now. But *the judgment doesn't get outsourced; the typing does.* Architecture and review decisions stay with me.",
  items: [
    {
      kicker: "Quality",
      title: "Evals & AI quality engineering",
      body: '"Is this output good?" usually means three different questions from three different stakeholders. You have to decide which one you\'re answering before you can measure anything.',
    },
    {
      kicker: "Design",
      title: "Agentic system design",
      body: "Agents as production components: MCP, multi-agent workflows, permission and trust models.",
    },
    {
      kicker: "Security",
      title: "AI security",
      body: "Prompt and indirect injection, agent permission models. The failure modes compound with the auth and security work I already do.",
    },
    {
      kicker: "Systems",
      title: "Distributed-systems depth",
      body: "The work agents are worst at, and where the expensive-to-reverse decisions still live.",
    },
  ],
};

// TODO(blog): when the /blog page ships, move articles into a shared posts
// manifest (src/content/posts.ts, from claude_websie/blog/posts.js), link
// each card to /blog/<slug> and link the aside ("Read the blog").
export const writing: WritingSection = {
  num: "05",
  title: "Writing",
  aside: "Architecture decisions, written up in full.",
  articles: [
    {
      slug: "keep-the-steering-wheel",
      title: "Keep the steering wheel: 3 ways to future-proof your auth",
      date: "2026-06-09",
      readTime: 11,
      tags: ["architecture", "security", "auth"],
    },
    {
      slug: "securing-auth-large-scale",
      title:
        "Securing auth in a large-scale production system — and why three standard architectures didn't survive a closer look",
      date: "2026-05-14",
      readTime: 16,
      tags: ["architecture", "aws", "nextjs"],
    },
    {
      slug: "sketching-out-the-extremes",
      title:
        "Sketching out the extremes: designing architectures for highly unpredictable projects",
      date: "2024-08-18",
      readTime: 5,
      tags: ["architecture", "microservices"],
    },
  ],
};

export const contact: Contact = {
  label: "Start a conversation",
  title: "Have a decision worth *getting right?*",
  body: "A system review, a fractional engagement, or a build where design and delivery belong to the same person. Tell me what you're weighing and I'll tell you straight whether I can help.",
  cta: "Book a conversation",
};
