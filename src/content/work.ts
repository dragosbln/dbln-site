import type { CaseStudy, Contact, PageHero } from "./types";

/**
 * /work page content. Case studies follow a fixed spine:
 * situation → decision → approach → outcomes → proof.
 * Prose is rich text: **…** -> <strong> (src/lib/richText.tsx).
 * A case renders its diagram when `diagram: true` AND
 * src/components/CaseDiagram has an entry for its id.
 */

export const workHero: PageHero = {
  eyebrow: "Selected work",
  title: "The work, and the *decisions* behind it.",
  lede: "Six engagements across insurance, fintech, gaming, healthtech and field service. For each: the situation, the call that was expensive to reverse, how I approached it, and what it shipped. The numbers are real.",
};

export const workCta: Contact = {
  label: "Start a conversation",
  title: "Recognize your situation in one of *these?*",
  body: "A decision that's expensive to reverse (auth, data, system boundaries), or a build where design and delivery belong to the same person. That's where I'm useful. Tell me what you're weighing and I'll tell you straight whether I can help.",
  cta: "Book a conversation",
};

export const caseStudies: CaseStudy[] = [
  {
    id: "pie",
    name: "Pie Insurance",
    sector: "Insurance · enterprise platform",
    period: "2025 — 2026",
    role: "Senior Software Engineer (contract)",
    engagement: "Hands-on senior engineering",
    tagline:
      "Owning the authentication track of a unified frontend re-architecture across a 100+ microservice platform.",
    situation:
      "Pie's Partner Portal runs on **100+ backend microservices**, and the frontend was being consolidated into one unified application. Authentication sat on a legacy Amplify/SRP flow that had become load-bearing without anyone choosing it on purpose. Fine, until the day you need to change it.",
    decision:
      "The auth architecture was the expensive-to-reverse call. Framework, where tokens live, which OAuth flows, how to handle **multiple Cognito user pools**. Get any of it wrong and 100+ services inherit the mistake. I owned that track, wrote the decisions down as ADRs **before** writing the code, and pressure-tested them with Product, UI/UX, Finance and senior leadership.",
    approach:
      "I authored the ADRs, then implemented the result: a modern **OAuth flow on Cognito Managed Login**, replacing the legacy Amplify/SRP flow. Alongside it I designed a generic notification system that works with **100+ services**, shipped a self-serve document-generation feature that cut manual support load by **~80%**, and contributed to a platform-wide shift from BFF-heavy to direct-to-backend. Agentic tools (Claude Code, Cursor) carried the scaffolding and refactors; the architecture and review calls stayed with me.",
    outcomes: [
      { stat: "100+", label: "services on the notification system" },
      { stat: "~80%", label: "less support load via self-serve docs" },
      { stat: "OAuth", label: "Amplify/SRP → Cognito Managed Login" },
    ],
    proof: {
      quote:
        "Before diving into the code, he takes the time to thoroughly understand the business requirements — that meticulous upfront analysis lets him anticipate complex edge cases and architectural roadblocks long before they reach production. He has the rare maturity to provide constructive pushback when necessary.",
      name: "Shilpi Reddy",
      role: "Engineering Leader · Pie Insurance",
    },
    stack: ["TypeScript", "Node.js", "Next.js", "AWS Cognito", "OAuth", "Event-driven"],
    diagram: true,
  },
  {
    id: "bullseye",
    name: "Bullseye Web3 Studio",
    sector: "Web3 · gaming",
    period: "2024 — 2025",
    role: "Lead Backend Architect & Developer (contract)",
    engagement: "Architecture + hands-on build",
    tagline: "Architecting and leading the backend for two greenfield Web3 games.",
    situation:
      "Two products from zero: AI Nexus, a Unity-powered social-metaverse mobile game, and A1X Clone Machine, a web app for creating AI agents. Neither had product-market fit yet, and nobody could say how fast either would grow. The backend had to handle growth without burning money waiting for it.",
    decision:
      "The hard call was scope, not scale. I committed to an **event-driven microservices** architecture on GCP, then kept cutting: no orchestrator, Firebase Cloud Messaging instead of custom websockets, nothing built for a growth curve we hadn't seen yet.",
    approach:
      "I architected and led the backend end to end, from first principles through CI/CD and the blockchain integrations, translating ambitious game-design and product requirements into services that stayed cheap and stable as the products grew.",
    outcomes: [
      { stat: "150k+", label: "registered users" },
      { stat: "< $500/mo", label: "GCP across 10+ services" },
      { stat: "2", label: "products shipped from zero" },
    ],
    proof: null,
    stack: ["Node.js", "NestJS", "Express", "GCP", "MongoDB", "Event-driven", "CI/CD", "Blockchain"],
    diagram: true,
  },
  {
    id: "parentool",
    name: "Parentool",
    sector: "Healthtech · 0→1",
    period: "2020 — 2025",
    role: "CTO & shareholder (part-time)",
    engagement: "Fractional CTO",
    tagline: "Fractional CTO from idea to a top-3 App Store health app, all on organic growth.",
    situation:
      "A bootstrapped healthtech idea with non-technical founders: no product, no team, no technical direction, and no outside funding to paper over mistakes.",
    decision:
      "As the technical owner, the recurring decision was allocation: what to build, what to defer, and where limited resources buy the most progress toward product-market fit. The rest was building a team and a process that could carry it without burning the runway.",
    approach:
      "I took it from Figma designs to live apps on both stores, then owned architecture, delivery and the technical side of growth and hiring, eventually formalized as CTO and shareholder. Every decision got explained in plain terms to non-technical founders.",
    outcomes: [
      { stat: "10,000+", label: "users, organic" },
      { stat: "#3", label: "App Store Health & Fitness" },
      { stat: "7%+", label: "paid conversion" },
      { stat: "2,000+", label: "paid consultations · 16+ fields" },
    ],
    proof: {
      quote:
        "He delivered a highly functional, almost bugless solution in the exact timeline we agreed — and could explain to us, non-technical people, everything happening in the backend.",
      name: "Petruța Costea",
      role: "Founder · Parentool",
    },
    stack: ["React Native", "Node.js", "Firebase", "Cloud", "Software Architecture"],
    diagram: true,
  },
  {
    id: "glede",
    name: "Glede",
    sector: "Consumer · production rescue",
    period: "2021 — 2022",
    role: "Mobile expert · full-stack",
    engagement: "Hands-on senior engineering",
    tagline: "Stabilizing a live microgifting app, then pushing it toward B2B.",
    situation:
      "A microgifting app with a built-in viral loop (send a small gift; the recipient installs the app to redeem it, then gets nudged to send their own) had grown past **30,000 users**, and a struggling production codebase was causing real problems for paying customers.",
    decision:
      "The call was triage versus rebuild on a live, revenue-affecting product: what to fix first without making things worse, and how to open a B2B direction on top of a codebase that was already wobbling.",
    approach:
      "I came in as the mobile expert, fixed the critical problems, improved performance in the hot paths, and shipped new functionality, notably the move toward B2B and an **Apple Wallet** integration for gift redemption.",
    outcomes: [
      { stat: "30,000+", label: "users" },
      { stat: "Hot paths", label: "performance recovered" },
      { stat: "B2B + Wallet", label: "new direction shipped" },
    ],
    proof: {
      quote:
        "An amazing programmer. He had no problems turning business requirements into code, and worked really well with our designers — even when the design wasn't ready yet.",
      name: "Erik Kjernlie",
      role: "Co-Founder & CTO · Glede",
    },
    stack: ["React Native", "Node.js", "Firebase", "GCP", "Software Architecture"],
    diagram: true,
  },
  {
    id: "reach",
    name: "Reach Finance",
    sector: "Fintech",
    period: "2022 — 2023",
    role: "Full-stack lead",
    engagement: "Hands-on + architecture",
    tagline: "The foundations for a fintech app that acts as a personal financial advisor.",
    situation:
      "A fintech product where users set goals (buy a house, retire early) and get projections, a concrete strategy and progress tracking toward them. Greenfield, and I was brought in at the very start.",
    decision:
      "Early-stage fintech lives or dies on its foundations. The call was to set the architecture, code structure and development process for the AWS backend up front, in a tight loop with business and design, so the structure and the product could grow together.",
    approach:
      "Full-stack lead from day one: I built the React Native app from design and business requirements while establishing the AWS backend architecture and the team's development process.",
    outcomes: [
      { stat: "0 → shipped", label: "mobile app from scratch" },
      { stat: "AWS", label: "backend + process foundations" },
    ],
    proof: {
      quote:
        "Truly a stellar developer. As we were building a very complex fintech application, his experience, problem-solving and speed were extremely valuable. He creates the right solutions, is 100% reliable, and delivers what you need — in time and quality.",
      name: "Daniel Hecker",
      role: "Project Manager / Deputy Division Head · Frankfurter Bankgesellschaft",
    },
    stack: ["React Native", "Node.js", "AWS", "Software Architecture"],
    diagram: true,
  },
  {
    id: "equinet",
    name: "Equinet — by Mustad",
    sector: "Field service · offline-first",
    period: "2021",
    role: "Senior engineer",
    engagement: "Hands-on senior engineering",
    tagline: "Collaborative organization management inside an offline-first architecture.",
    situation:
      "An offline-first React Native app helping farriers run their businesses: scheduling, inventory, multi-user organizations. I joined a team two years into the product to lift performance, ship features and raise codebase quality.",
    decision:
      "The hard part was never the UI. It was organization management and collaborative actions in an offline-first model, where **sync and conflict handling** are the whole problem. That's where I focused.",
    approach:
      "I designed and implemented org management and collaborative actions with the sync and conflict handling an offline-first architecture demands, alongside performance and quality improvements across the codebase.",
    outcomes: [
      { stat: "Offline-first", label: "multi-user orgs shipped" },
      { stat: "Sync + conflicts", label: "the hard part, owned" },
    ],
    proof: {
      quote:
        "One of those valuable developers you'd want to build your team around — a pragmatic problem solver, keen to improve code and product quality while keeping the user in mind.",
      name: "Sebastiaan Ordelman",
      role: "Product Director & CTO",
    },
    stack: ["React Native", "Node.js", "Offline-first"],
    diagram: true,
  },
];
