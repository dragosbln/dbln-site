import {
  customerOperationsPath,
  homeBooking,
  site,
  testimonials,
} from "./site";
import type {
  BookingBandContent,
  CustomerOperationsHero,
  DeliverablesBrowser,
  ProcessSection,
  QuestionsSection,
  ReviewerCard,
  StorySection,
} from "./types";

/**
 * Content of the customer-operations review page
 * (/customer-operations-review). Design source: the approved reference page
 * dbln-review-customer-operations.html (2026-11-03). Every string is
 * verbatim from it, curly quotes, dashes and middle dots included; the
 * teal labels keep the reference's capitals. Components render this
 * content; they must not contain copy of their own.
 * Inline emphasis: **text** -> <strong>, *text* -> <em> (src/lib/richText.tsx).
 */

export { customerOperationsPath };

/** Section ids; in-page hrefs are built from these so links and targets can't drift. */
export const anchors = {
  story: "review-in-practice",
  process: "how-it-runs",
  deliverables: "what-you-get",
  reviewer: "who-runs-it",
  questions: "questions",
  contact: "contact",
} as const;

const lede =
  "An independent review of the customer-service workflow you want to expand—from answering customers to changing orders or bookings. I examine conversations, actions and system design, and give your team reproducible findings, prioritized changes and checks to support the next rollout.";

export const hero: CustomerOperationsHero = {
  eyebrow: "For teams building customer-service AI",
  title: "Know what your AI agent is ready to *handle next*.",
  lede,
  // DRAFT for Dragos: the reference carries a design-reference <title>, not
  // a production one. Composed from the home page's offer name and this
  // page's eyebrow.
  pageTitle: "The AI Reliability Review for customer-service AI",
  /** The lede, verbatim; the design has no separate summary. */
  metaDescription: lede,
  doors: {
    primary: {
      label: "See what you get",
      href: `${customerOperationsPath}#${anchors.deliverables}`,
    },
    secondary: {
      label: "Let’s discuss your next rollout",
      href: `${customerOperationsPath}#${anchors.contact}`,
    },
  },
  panel: {
    title: "The engagement, at a glance",
    goesIn: {
      label: "Goes in",
      items: [
        {
          title: "One workflow to expand",
          body: "Customer requests, permitted actions and handoffs.",
        },
        {
          title: "System access",
          body: "Conversations, action results, the relevant code and configuration.",
        },
      ],
    },
    lenses: {
      label: "I REVIEW · TWO LENSES",
      items: [
        {
          title: "Behaviour",
          body: "What the agent tells customers, what it changes, and when it hands over.",
        },
        {
          title: "Design",
          body: "How instructions, knowledge, permissions and integrations shape that behavior.",
        },
      ],
      bridge: "Trace the behavior back to the system.",
    },
    comesOut: {
      label: "Comes out",
      items: [
        { num: "01", title: "Workflow findings, with evidence", format: "Document" },
        { num: "02", title: "Design findings", format: "Document" },
        { num: "03", title: "Roadmap for the next rollout", format: "Document" },
        {
          num: "04",
          title: "Rollout gates and regression checks",
          format: "Code + cases",
        },
        { num: "05", title: "Executive summary", format: "Presentation" },
      ],
    },
    timeline: "Two to three weeks",
  },
};

/** 01 · A review in practice: the trigger and three illustrated steps on a horizontal rail. */
export const story: StorySection = {
  num: "01",
  title: "A review in practice",
  aside: "Fictional scenario, real failure patterns",
  nav: { label: "Scroll the review story", back: "Back", next: "Next" },
  railLabel: "The trigger and three illustrated review steps",
  status: "Showing {name}.",
  cards: [
    {
      kind: "trigger",
      name: "the trigger",
      ariaLabel: "The trigger",
      label: "THE TRIGGER",
      title:
        "Automated refunds are in beta. The results look promising, but the exceptions don’t add up.",
    },
    {
      kind: "step",
      name: "the doubt",
      ariaLabel: "Step 1 of 3: the doubt",
      art: "team",
      artAlt: "Two colleagues examining an unexplained failure.",
      label: "01 · THE DOUBT",
      title: "The exceptions don’t add up.",
      lead: "Routine refunds pass. Reports of a duplicate payment and inconsistent handoffs prove hard to reproduce.",
      body: "The team brings me in to investigate the anomalies and establish what evidence they need before expanding.",
    },
    {
      kind: "step",
      name: "the discovery",
      ariaLabel: "Step 2 of 3: the discovery",
      art: "pattern",
      artAlt: "The same failure repeated across several cases.",
      label: "02 · THE DISCOVERY",
      title: "A repeatable failure emerges.",
      lead: "I use conversation patterns and design notes to identify likely weak points, then run targeted cases against the agent. After several iterations, the discovery:",
      finding:
        "A refund succeeds, but its response is lost. On restart, a new identity lets it pass duplicate protection again.",
      more: "**Also found:** repeat conversations bypass cumulative limits; pending refunds are reported as completed.",
    },
    {
      kind: "step",
      name: "the next step",
      ariaLabel: "Step 3 of 3: the next step",
      art: "conditions",
      artAlt: "A working checklist with explicit passing and unresolved conditions.",
      label: "03 · THE NEXT STEP",
      title: "Clear conditions for expansion.",
      lead: "With engineering, we define changes to refund identity, account limits and payment status. Each finding gets a repeatable check.",
      body: "Unresolved paths stay with a person. The rollout decision rests on specific evidence, with the gaps recorded.",
    },
  ],
};

/** 02 · How it runs: three phases, seven collapsed steps. */
export const process: ProcessSection = {
  num: "02",
  title: "How it runs",
  aside: "Two to three weeks",
  meta: { team: "Your team", checkpoint: "Checkpoint" },
  phases: [
    {
      title: "Agree scope",
      note: "Before the review",
      steps: [
        {
          num: "0",
          name: "Scope and direction",
          timing: "Before",
          summary: "Define the next expansion and the evidence needed to decide.",
          prose:
            "We agree what you want the agent to handle next, what it must get right, and what the review needs to establish. Then we set the scope, access, terms and fixed fee.",
          team: "Project owner · one hour",
          checkpoint: "Decision, review criteria and scope agreed",
        },
      ],
    },
    {
      title: "Investigate",
      note: "Evidence and design inform each other.",
      steps: [
        {
          num: "1",
          name: "Map the workflow",
          timing: "Days 1–2",
          summary: "Map the system, record hypotheses and preserve the evidence.",
          prose:
            "I trace the workflow through instructions, knowledge, actions and handoffs. We record the version under review and the team’s hypotheses, then preserve the evidence needed to test them.",
          team: "Engineering · access and context",
          checkpoint: "Workflow mapped and review version recorded",
        },
        {
          num: "2",
          name: "What it does today",
          timing: "Weeks 1–2",
          summary:
            "Examine conversations and action results, then probe likely weak points.",
          prose:
            "With criteria agreed with your domain expert, I use output patterns and design hypotheses to build targeted cases. Each round informs the next as I test for failures beyond those already reported.",
          team: "Domain expert · one hour; staging access",
          checkpoint: "Tested cases and evidence supporting each finding",
        },
        {
          num: "3",
          name: "How it is built",
          timing: "Weeks 1–2",
          summary: "Trace failures to system design and test its limits for expansion.",
          prose:
            "I trace findings to their causes and examine design assumptions the proposed expansion depends on. That analysis shapes further tests; their results refine the design findings.",
          team: "Engineering owners · focused discussions",
          checkpoint: "Design causes and expansion constraints identified",
        },
      ],
      critical: "**If something critical turns up:** we discuss it the same day.",
    },
    {
      title: "Prepare the next step",
      note: "Priorities, checks and handover",
      steps: [
        {
          num: "4",
          name: "Prioritize changes",
          timing: "Week 2",
          summary: "Agree what to change first and how to verify each change.",
          prose:
            "We separate blockers to the next rollout from improvements that can follow. The people who will own the changes review the priorities and the evidence needed to verify them.",
          team: "Project owner · one hour",
          checkpoint: "Priorities and verification conditions agreed",
        },
        {
          num: "5",
          name: "Hand over the checks",
          timing: "Weeks 2–3",
          summary: "Package the tested cases so your team can rerun and maintain them.",
          prose:
            "I turn the investigation’s cases into repeatable rollout and regression checks, including blockers that still fail. Your team runs them with me, then takes ownership of maintaining them.",
          team: "Check owners · half a day",
          checkpoint: "Your team can rerun the checks and see unresolved blockers",
        },
        {
          num: "6",
          name: "Readout and handover",
          timing: "Final days",
          summary: "Present the findings, conditions for expansion and remaining gaps.",
          prose:
            "I verify the findings and share them with the people involved before the executive presentation. We discuss the rollout recommendation, remaining uncertainty and conditions to meet, then complete the handover.",
          team: "Pre-reads, executive readout and handoff",
          checkpoint: "Executive presentation, documents and checks handed over",
        },
      ],
    },
  ],
};

/** 03 · What you get: the deliverable browser with illustrative excerpts of the refund review. */
export const deliverables: DeliverablesBrowser = {
  num: "03",
  title: "What you get",
  aside: "Illustrative excerpts · Refund review",
  pickerLabel: "Choose a deliverable",
  items: [
    {
      key: "summary",
      title: "Executive summary",
      format: "Presentation",
      purpose: "The recommendation, its evidence and the conditions for the next rollout.",
    },
    {
      key: "findings",
      title: "Workflow findings, with evidence",
      navTitle: "Workflow findings",
      format: "Document",
      purpose: "A finding inventory linked to evidence and runnable reproduction cases.",
    },
    {
      key: "design",
      title: "Design findings",
      format: "Document",
      purpose: "System maps, failure mechanisms and constraints on the next expansion.",
    },
    {
      key: "roadmap",
      title: "Roadmap for the next rollout",
      format: "Document",
      purpose:
        "An ordered plan for this expansion, with owners and verification conditions.",
    },
    {
      key: "checks",
      title: "Rollout gates and regression checks",
      format: "Code + cases",
      purpose:
        "A runnable handover: cases that block expansion and checks for what already works.",
    },
  ],
  summary: {
    label: "ROLLOUT RECOMMENDATION · SIMPLIFIED EXAMPLE",
    heading: "Keep refunds supervised until the blockers clear.",
    bullets: [
      [
        "One approved refund can be paid twice after a restart. ",
        { label: "(F01)", go: "findings" },
      ],
      [
        "Account limits and payment-status handling also need changes. ",
        { label: "(F02 / G02)", go: "checks", caseKey: "cap" },
        " ",
        { label: "(F03 / G03)", go: "checks", caseKey: "status" },
      ],
      ["Each blocker has a repeatable check."],
    ],
    bottom:
      "The team now owns gates and regression sets for these findings. The roadmap plans the changes.",
  },
  findings: {
    label: "F01 · FINDING 1 OF 3",
    heading: "One approved refund is paid twice.",
    body: "The payment succeeds, its response is lost, and the agent restarts. A new payment key lets the same refund pass duplicate protection again.",
    evidence: [
      {
        label: "Evidence",
        value: [
          "Action trace + payment records ",
          { label: "(G01)", go: "checks", caseKey: "retry" },
        ],
      },
      {
        label: "Reproduce",
        value: [
          "A runnable case with the starting state, injected failure and payment assertions.",
        ],
      },
    ],
  },
  design: {
    label: "D01 · SELECTED DESIGN FINDING",
    heading: "The refund’s identity changes at restart.",
    body: "The refund tool derives its payment key from the current run. After a restart, the same approved refund gets a new key.",
    columns: [
      {
        label: "Requirement",
        value: ["Persist and reuse a key for the approved refund across executions."],
      },
      {
        label: "Verify with",
        value: [
          "Lost response + restart ",
          { label: "(G01)", go: "checks", caseKey: "retry" },
        ],
      },
    ],
    diagram: {
      alt: "A refund service contains the refund tool and its persistent refund store. The agent runtime supplies requests and run IDs from outside this service. The tool reads the approval record and calls an external Payment API. The red key derivation inside the tool marks the faulty dependency on execution identity.",
      runtime: "Agent runtime",
      service: "Refund service",
      tool: "Refund tool",
      faultFrom: "run ID",
      faultTo: "key",
      store: ["Refund", "store"],
      api: "Payment API",
      apiMeta: "deduplicates by key",
    },
  },
  roadmap: {
    step: {
      label: "R01 · BEFORE EXPANSION",
      heading: "Give each approved refund a durable identity.",
      body: "Persist the payment key before the first attempt. Reconcile uncertain results before retrying.",
      meta: [
        { label: "Owner", value: ["Payments integration team"] },
        {
          label: "Verified when",
          value: [
            "A lost response and restart still produce only one payment. ",
            { label: "(G01)", go: "checks", caseKey: "retry" },
          ],
        },
      ],
    },
    next: [
      "R02–R03 · Account limits and payment status",
      "Re-run the suite on the release candidate.",
    ],
  },
  checks: {
    filesLabel: "Inspect a rollout gate",
    folders: { gates: "gates/", regression: "regression/", fixtures: "fixtures/" },
    openPrefix: "gates / ",
    cases: [
      {
        key: "retry",
        filename: "lost-response.yaml",
        lines: [
          { tone: "comment", text: "# Simplified example · linked to F01 / R01" },
          { tone: "key", text: "id: G01" },
          { tone: "key", text: "fixture: approved_refund" },
          { tone: "key", text: "fault:" },
          { text: "  after: payment_committed" },
          { text: "  inject: response_lost" },
          { tone: "key", text: "recover: restart_workflow" },
          { tone: "key", text: "assert:" },
          { text: "  payments_for_refund: 1" },
          { text: "  state: completed" },
        ],
        failure: "G01 · Duplicate payment",
        expected: "Expected 1 payment; observed 2.",
      },
      {
        key: "cap",
        filename: "account-cap.yaml",
        lines: [
          { tone: "comment", text: "# Simplified example · linked to F02 / R02" },
          { tone: "key", text: "id: G02" },
          { tone: "key", text: "fixture: customer_account" },
          { tone: "key", text: "account:" },
          { text: "  cap: 100" },
          { text: "  refunded: 80" },
          { tone: "key", text: "new_conversation: true" },
          { tone: "key", text: "refund_request: 30" },
          { tone: "key", text: "assert:" },
          { text: "  excess_refund: blocked" },
          { text: "  new_payments: 0" },
          { text: "  account_total: 80" },
        ],
        failure: "G02 · Account limit bypassed",
        expected:
          "80 already refunded + 30 requested exceeds the cap of 100. Expected blocked; observed paid.",
      },
      {
        key: "status",
        filename: "pending-status.yaml",
        lines: [
          { tone: "comment", text: "# Simplified example · linked to F03 / R03" },
          { tone: "key", text: "id: G03" },
          { tone: "key", text: "fixture: approved_refund" },
          { tone: "key", text: "provider_result: pending" },
          { tone: "key", text: "assert:" },
          { text: "  recorded_state: pending" },
          { text: "  customer_message:" },
          { text: "    claims_completed: false" },
        ],
        failure: "G03 · Incorrect payment status",
        expected: "Provider status: pending. Customer message: completed.",
      },
    ],
    regression: ["approved.yaml", "handoff.yaml"],
    fixtures: ["payments.ts", "run-checks.ts", "README.md"],
    terminal: {
      command: "$ npx tsx run-checks.ts",
      runs: [
        { status: "pass", text: "regression/ · 2 cases" },
        { status: "fail", text: "G01 · lost response" },
        { status: "fail", text: "G02 · account cap" },
        { status: "fail", text: "G03 · pending status" },
      ],
    },
    note: "Cases, fixtures and runner are handed over together. Your team reruns the failing gates after changes and keeps them as regression checks.",
  },
};

// The quoted testimonial is the first one in site.ts (Shilpi Reddy); the
// page shows its first sentence, verbatim (test/customer-operations.test.mjs
// checks the cut against the full quote).
const quoted = testimonials.items[0];

/** 04 · Who runs it: the profile card, one testimonial, two articles. */
export const reviewer: ReviewerCard = {
  num: "04",
  title: "Who runs it",
  role: "Software engineer & architect",
  location: "Cluj-Napoca, RO · Remote",
  bio: [
    "Over nine years in software delivery, across engineering, architecture and technical leadership.",
    "My work on AI reliability looks at how agent behaviour, system design and testing fit together to reveal failures and establish what’s ready to roll out.",
  ],
  commitment: "I run every review myself, from the first call to the handoff.",
  links: [
    { label: "LinkedIn", href: site.socials.linkedin },
    { label: "Background & work", href: "/work" },
  ],
  testimonial: {
    label: "WHAT TEAMS SAY",
    quote:
      "Before diving into the code, he takes the time to thoroughly understand the business requirements — that meticulous upfront analysis lets him anticipate complex edge cases and architectural roadblocks long before they reach production.",
    name: quoted.name,
    role: quoted.role,
    href: quoted.href,
  },
  writing: {
    label: "SELECTED WRITING ON AI RELIABILITY",
    all: { label: "All writing", href: "/blog" },
    articles: [
      {
        title: "Did it check, or did it guess?",
        desc: "Investigating unreliable AI findings and building checks that catch the underlying failures.",
        href: "/blog/testing-ai-tools",
      },
      {
        title: "Reliability at the core",
        desc: "How state, failure handling and conversation history shape an agent’s reliability.",
        href: "/blog/5-rules-for-building-reliable-ai-agents",
      },
    ],
  },
};

/** 05 · Questions: seven, all shown, one open at a time. */
export const questions: QuestionsSection = {
  num: "05",
  title: "Questions",
  items: [
    {
      num: "01",
      q: "We already have AI engineers and evaluations. Why would we need this?",
      a: "Your team brings the domain expertise, product knowledge and experience of running the system. I bring depth in AI reliability and system design. We build on your existing evaluations, examine how the agent and its integrations behave together, and turn the findings into checks for your next rollout.",
    },
    {
      num: "02",
      q: "Is this useful before launch, or for an agent already in production?",
      a: "Both. The review can support a first release, an expansion or an investigation into inconsistent behaviour. We need a runnable workflow and a concrete decision to examine; the scope reflects what you’ve built and what you want to enable next.",
    },
    {
      num: "03",
      q: "What would you need from our team?",
      a: "A technical counterpart, the relevant policies, code and configuration, and access to conversations, action results and a suitable test environment. We establish the access, evidence gaps and expected involvement before agreeing the scope.",
    },
    {
      num: "04",
      q: "How do you handle customer data and actions that affect real accounts?",
      a: "We agree access, testing boundaries, processing tools and retention before work starts. Testing uses an isolated environment, with synthetic or redacted records where practical. Your material remains confidential, and nothing is published without your permission.",
    },
    {
      num: "05",
      q: "What does it cost, and how is the scope agreed?",
      a: "A fixed fee for an agreed scope, quoted after the first conversation. The proposal sets out the workflow, decision, deliverables and responsibilities before you commit.",
    },
    {
      num: "06",
      q: "Who implements the changes, and what happens after the review?",
      a: "Your team implements the product changes. I hand over the roadmap and runnable checks, and walk your engineers through using them to verify fixes. Any implementation support or further review is agreed separately.",
    },
    {
      num: "07",
      q: "What if you don’t find a serious issue?",
      a: "I report that plainly. You still receive the evidence from the agreed scope, reusable checks and the remaining uncertainties. Those results support your rollout decision within the boundaries of what we examined.",
    },
  ],
};

/** The booking band: the home page's, with this page's invitation. */
export const bookingBand: BookingBandContent = {
  ...homeBooking,
  body: "Let’s discuss your customer-service workflow, what your team is preparing to change, and where confidence is missing. We’ll work out whether a review would help and what it should focus on.",
};
