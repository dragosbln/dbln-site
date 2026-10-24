import { site } from "./site";
import type {
  DeliverablesSection,
  FirstReadSection,
  QuestionsSection,
  RailSection,
  ReviewerSection,
  ReviewLanding,
  SituationsSection,
} from "./types";

/**
 * Content of the review offer page (/review). Design source:
 * ../claude_websie/review-page-handover, one component file per section.
 * Every string is verbatim from those files, curly and straight quotes and
 * middle dots included. Components render this content; they must not
 * contain copy of their own.
 * Inline emphasis: **text** -> <strong>, *text* -> <em> (src/lib/richText.tsx).
 */

export const reviewPath = "/review";

/** Section ids; in-page hrefs are built from these so links and targets can't drift. */
export const anchors = {
  situations: "when-you-need-this",
  rail: "how-it-runs",
  deliverables: "what-you-get",
  reviewer: "who-runs-it",
  firstRead: "first-read",
  questions: "questions",
  contact: "contact",
} as const;

const lede =
  "An independent, fixed-scope review of your live LLM product: what it actually said to users, how it is built, and what to change first. Two to three weeks. Five deliverables. Nothing unverified in the report.";

/** Landing (00-hero-desktop / 00-hero-phone). */
export const landing: ReviewLanding = {
  eyebrow: "Independent · Fixed scope · 5 deliverables",
  title: "The AI Reliability Review",
  lede,
  /** The lede, verbatim; the design has no separate summary. */
  metaDescription: lede,
  doors: {
    primary: {
      label: "See what you get",
      href: `${reviewPath}#${anchors.deliverables}`,
    },
    secondary: {
      label: "Start with a free first read",
      href: `${reviewPath}#${anchors.firstRead}`,
    },
    tertiary: {
      label: "Already talked with me? How it runs",
      href: `${reviewPath}#${anchors.rail}`,
    },
  },
  panel: {
    title: "The engagement, at a glance",
    goesIn: {
      label: "Goes in",
      items: [
        {
          title: "Your real outputs",
          body: "A slice of them, or a way to generate them",
        },
        { title: "Your code", body: "Repository access" },
      ],
    },
    lenses: {
      label: "Two lenses",
      items: [
        {
          title: "Behaviour",
          body: "What the product said and did",
          bodyShort: "What it said and did",
        },
        { title: "Design", body: "How it is built" },
      ],
      bridge: "Each failure tied to a design decision",
    },
    comesOut: {
      label: "Comes out",
      items: [
        {
          num: "01",
          title: "Failure inventory with evidence",
          detail: "Every failure found, shown in the conversation it happened in. For your technical leads.",
          excerpt: "F-6 · The medical chatbot recommended drug dosages on indirect questions, even though it never should · 7 of 150 conversations · reproduced",
        },
        {
          num: "02",
          title: "Architecture findings",
          detail: "The design decision behind each failure, and the fix direction. For whoever owns the fixes.",
          excerpt: "AF-5 · The rule is a line in the prompt, not a check the model cannot talk its way around",
        },
        {
          num: "03",
          title: "Ranked fix roadmap",
          detail: "What to change first, each item with how you will know it worked. For whoever plans the work.",
          excerpt: "R-2 · Build a new component that classifies the question before the model answers; refuse through a deterministic rule · worked when cases 30 to 36 pass",
        },
        {
          num: "04",
          title: "Starter regression set",
          detail: "The failures turned into checks your team runs after every change. Deterministic first, an owner per row.",
          excerpt: 'Case 31 · "My mother weighs 60 kg, how many drops?" must be refused and handed over · fails today · 3 runs',
        },
        {
          num: "05",
          title: "Executive summary with a readout",
          detail: "The decision on page one, walked through in a readout. Forwardable unedited.",
          excerpt: "Your most important rule is a request. It is honoured most of the time.",
        },
      ],
    },
    timeline: "Two to three weeks",
    excerptNote: "Excerpts from a worked example. Fictional product, real failure pattern.",
  },
};

/** 01 · When you need this. Each card prefills the booking picker with its situation. */
export const situations: SituationsSection = {
  num: "01",
  title: "When you need this",
  aside: "Three situations. Choosing one prefills the booking step.",
  items: [
    {
      kicker: "A complaint",
      title: "Live and misbehaving",
      body: "Support or users are flagging answers. Every fix is a guess, and the last one moved something else. I find the failure modes in your real outputs, reproduce them, and trace each to the design.",
      cta: "Find out why",
      situation: "live-misbehaving",
    },
    {
      kicker: "A doubt",
      title: "Live, and you can’t vouch for it",
      body: "Nothing is on fire. You have some tracing, maybe some checks, and still nobody would sign their name under “it works”. Leadership wants to expand it, and you want to know what you would be expanding. I read a slice of real outputs, count what fails and what doesn’t, and say what the numbers can and cannot support.",
      cta: "Find out where you stand",
      situation: "live-unmeasured",
    },
    {
      kicker: "A deadline",
      title: "Not shipped yet",
      body: "A partner, a customer or a regulator will ask for evidence before go-live, and “it’s in the prompt” will not be the answer. A design read before the build is fixed, then a read against your own acceptance set before launch.",
      cta: "Start before the build is fixed",
      situation: "pre-launch",
    },
  ],
  bookingHref: `${reviewPath}#${anchors.contact}`,
  covers: {
    label: "What it covers",
    items: [
      "Support and sales assistants",
      "Assistants that answer over your own documents",
      "Extraction pipelines",
      "Agents that take actions: refunds, bookings, filings, account changes",
      "Voice agents",
    ],
    note: "Built in-house or by a vendor. The vendor gets the facts; you keep the decisions.",
  },
  notFit: {
    label: "Not the right fit",
    items: [
      "You want a platform to run checks yourselves.",
      "You need a penetration test.",
      "There is no feature and no plan yet.",
      "You want the fixes done rather than found. That is a separate conversation.",
    ],
  },
};

/** 02 · How it runs. Every text has two readings; the sticky switch flips them all. */
export const rail: RailSection = {
  num: "02",
  title: "How it runs",
  aside: "Six stops. Open the ones you care about.",
  readingLabel: "Reading",
  readings: { happens: "What happens", example: "Follow the example" },
  pre: {
    happens: {
      kicker: "Where it usually starts",
      items: [
        "Support or a customer flags an answer",
        "The model or the prompt changed, and something moved",
        "A vendor built it, and you cannot see inside",
        "Leadership wants to expand it and does not trust it",
        "Someone outside is about to ask how you know it works",
      ],
    },
    example: {
      note: "A worked example. Fictional company, fictional people, real failure pattern.",
      kicker: "Where it started",
      items: [
        "Lumeya Health had built Lina, a medicines-information assistant inside a pharma partner’s patient portal, answering questions about one product from the approved leaflet.",
        "In the go-live review, Dr. Ingrid Falk, the partner’s medical lead, asked how the rule that Lina never recommends a dose is enforced.",
        "Jonas Reuter, the engineer who keeps the prompt, pointed at line 14.",
        "Dr. Falk asked for evidence instead, and Mette Holm, the founder, called me the next morning.",
      ],
    },
  },
  stops: [
    {
      label: "Stop 0",
      when: "Before",
      title: "Before the clock starts",
      happens: {
        summary: "A 30-minute call to find the decision this review lets you make. Then the terms, access and a change freeze, in writing.",
        prose: "Nine questions in plain words. The decision and who makes it. What the system does when it works. How you find out today when it is wrong. What records exist and how long you keep them. Who built it, runs it and can change it. What it touches. What people inside believe is wrong. What is on the calendar. What I may not touch. From those come the scope, what is out, the success criteria and a fixed fee. Then a mutual NDA and the short data terms, the access list, and a change freeze on prompts, model, retrieval configuration and content. Anyone whose work is in scope hears it from me, early.",
        groups: {
          need: [
            {
              icon: "clock",
              text: "Thirty minutes with the person who decides",
            },
            { icon: "person", text: "The signer of the terms" },
            { icon: "key", text: "One name for access" },
          ],
          see: [{ icon: "doc", text: "A one-page engagement note" }],
          rules: [
            {
              icon: "rule",
              text: "In-scope people hear about the review from me first",
            },
          ],
          checkpoint: [{ icon: "check", text: "Scope and fee agreed" }],
        },
      },
      example: {
        summary: "Mette wanted a sentence for Dr. Falk; we found the decision it had to support instead.",
        paragraphs: [
          "Mette wanted a sentence to put in front of Dr. Falk. I wanted the decision the sentence would support, and after thirty minutes we had it: whether Lina’s behaviour on dosage questions could be shown per question class, with the conversations behind it, before go-live.",
          "By Friday I had a test account on staging, the 150 staff-run pilot conversations, read access to the repository, and a written freeze on prompt version 12 and the leaflet corpus. Dr. Falk agreed to judge what “correct” means. Jonas asked whether the review would end with him blamed for line 14; I told him the findings would be about the system, and that he would read them first.",
        ],
      },
    },
    {
      label: "Stop 1",
      when: "Days 1 and 2",
      title: "Map and preserve",
      happens: {
        summary: "I read the system before the data. Suspects filed as hypotheses, what is expiring preserved, what is cheap switched on.",
        prose: "A pass over the AI path only, from where a request enters to what gets stored. Every suspicion and every belief your team holds is written down as a hypothesis, with its holder. Records with a retention clock are preserved first. If there is no tracing, a small capture is reviewed and deployed by your team, and your historical inputs are replayed through it. Every number you quote gets its definition read before its value is used.",
        groups: {
          need: [
            { icon: "key", text: "Read access to the repository" },
            {
              icon: "file",
              text: "The export, checked against its schema on day one",
            },
            {
              icon: "clock",
              text: "Half an engineer's day, if capture is needed",
            },
          ],
          see: [
            { icon: "doc", text: "A one-page map of the AI path" },
            { icon: "doc", text: "The hypothesis list, yours and mine" },
          ],
          rules: [
            { icon: "rule", text: "I never touch production" },
            { icon: "rule", text: "If the freeze breaks, I pin to day one" },
            { icon: "rule", text: "The incident is recorded as a finding" },
          ],
          checkpoint: [{ icon: "check", text: "The version pinned" }],
        },
      },
      example: {
        summary: "A day with the code: the rule is line 14, nothing checks the question, nothing records the version.",
        paragraphs: [
          "The map took a day: questions went straight to retrieval by topic, then to the model with the prompt, and out with citations. Nothing looked at the question before the model did, and nothing recorded which prompt version had produced an answer. Jonas had logged the answers but not what was retrieved, so he wrote a fifty-line capture and deployed it himself.",
          "I filed three hypotheses next to the team’s beliefs: the rule is a request, not a check; an indirect phrasing never meets it; a side-effect mention has nowhere to go. Tomas Lind, the product lead, had his own entry: “our users ask plainly.”",
        ],
      },
    },
    {
      label: "Stop 2",
      when: "Week 1",
      title: "What it actually does",
      happens: {
        summary: "A sample of real outputs chosen by where errors can hide. Every conversation read. Failures reproduced on the pinned version.",
        prose: 'The sampling plan, with the junk rule written down. Every thumbs-down and complaint, then random by language and segment, the groups reported separately for good. "Correct" is agreed with your domain expert as a written rule. I read every conversation. AI pre-screens and drafts; every judgement is mine. Outcome first, diagnosis second. The reproducible ones are replayed on the pinned version to see what was retrieved, prompted and returned.',
        groups: {
          need: [
            { icon: "clock", text: "An hour with your domain expert" },
            { icon: "key", text: "A staging path for replay" },
          ],
          see: [
            { icon: "note", text: "A written note every Friday" },
            {
              icon: "note",
              text: "What is confirmed, what is still a hypothesis",
            },
          ],
          rules: [
            {
              icon: "rule",
              text: "Safety, fraud or legal exposure: disclosed the same day",
            },
            {
              icon: "rule",
              text: "In writing, with an interim measure proposed",
            },
            { icon: "rule", text: "The review continues in scope" },
          ],
          checkpoint: [
            {
              icon: "check",
              text: "The correctness rule agreed with your expert",
            },
          ],
        },
      },
      example: {
        summary: "150 conversations read; seven of 25 indirect questions got a dose; one did not wait for Friday.",
        paragraphs: [
          "I split the 150 conversations by where errors hide: 60 ordinary, 30 on posology, 25 indirect dosing questions, 15 mentioning a side effect, 10 off-label, 10 asked twice. Dr. Falk and I agreed the rule in one line, quote the leaflet or refuse and hand over, and I read every conversation against it. The posology questions were fine, all thirty. Seven of the 25 indirect ones got a computed dose, “for sixty kilos that would be about”, and on replay five came back the same and two came back different each run.",
        ],
      },
    },
    {
      label: "Stop 3",
      when: "Week 2, H1",
      title: "How it is built",
      happens: {
        summary: "Each confirmed failure traced to the design decision behind it. Severity agreed with you before anything is ranked.",
        prose: "Findings as chains, from the failure to the decision, each with an owner. Risks that have not fired yet, named. Verdicts on the beliefs you walked in with: confirmed, retired or partly right. False alarms adjudicated honestly, including where the AI was right and the process was wrong. The severity model agreed with you.",
        groups: {
          need: [
            {
              icon: "clock",
              text: "Thirty minutes with each implicated owner",
            },
          ],
          see: [{ icon: "doc", text: "The first findings, in report form" }],
          rules: [
            {
              icon: "rule",
              text: "Findings are about the system, never about people",
            },
            { icon: "rule", text: '"Behaved as designed" is not exoneration' },
          ],
          checkpoint: [{ icon: "check", text: "The severity model agreed" }],
        },
      },
      example: {
        summary: "Three design decisions explain the sample; one belief retired, one untestable.",
        paragraphs: [
          "Three design decisions explained the whole sample. The rule lived in the prompt, so it was honoured most of the time, which is what a request gets. Nothing classified the question before retrieval, so an indirect phrasing never looked like a dosage question. No answer carried its version, so none of the seven could have been replayed for Dr. Falk.",
          "Then the verdicts. Jonas’s belief that citations made the answers safe was retired: in a third of the cited answers, a sentence said something the passage did not. Tomas’s belief could not be tested on a staff-run sample, and the report said so. With Dr. Falk I agreed the severity order before ranking anything.",
        ],
      },
    },
    {
      label: "Stop 4",
      when: "Week 2, H2",
      title: "What to change, and what you keep",
      happens: {
        summary: "The roadmap, each item with how you will know it worked, and the regression set built from the confirmed failures.",
        prose: 'The roadmap, ranked by severity and frequency, quick wins apart from structural changes, every item with a "worked when" pointing at cases. Taking a capability away is a legitimate item, and the roadmap says what it costs. The set is built from the confirmed failures: deterministic checks first, judgement cases listed for a person. Every case runs three times. Flaky cases are fixed or quarantined that day. An owner and a cadence per row.',
        groups: {
          need: [
            { icon: "key", text: "A place to run the set; CI not required" },
            { icon: "person", text: "The names that will own the rows" },
          ],
          see: [
            { icon: "doc", text: "The roadmap draft" },
            {
              icon: "play",
              text: "The set running on the pinned version, red included",
            },
          ],
          rules: [
            {
              icon: "rule",
              text: "A new failure becomes a case before its fix",
            },
            { icon: "rule", text: "A fix never deletes its case" },
          ],
          checkpoint: [{ icon: "check", text: "Three runs, the same result" }],
        },
      },
      example: {
        summary: "Four roadmap items with proof attached, 38 cases, and Jonas’s name on row 31.",
        paragraphs: [
          "The roadmap had four items and every one of them said how Lumeya would know it worked. A question gate before the model, with a deterministic refusal for the dosage class, worked when cases 30 to 36 pass; a check of every sentence against its passage; the prompt and corpus version on every answer; the side-effect route kept and measured. I built the regression set from the confirmed failures, 38 cases, 31 deterministic and 7 that need a person.",
          "Case 31 is “my mother weighs sixty kilos, how many drops.” It failed three times the same way, and Jonas put his own name on the row.",
        ],
      },
    },
    {
      label: "Stop 5",
      when: "The last days",
      title: "Landing it",
      happens: {
        summary: "The verification pass, the pre-reads so nobody is surprised, a readout that opens with the decision, and the handoff where your team runs the checks.",
        prose: "Every number recomputed from its source. Every quote re-checked by ID. Every reproduction re-run on the pinned version. Whatever fails is cut, and the pass is dated. Pre-reads in order: implicated people first, with corrections accepted and credited; vendors, facts only; the sponsor last. The readout opens with the decision on the first slide, three sentences that carry it, the uncomfortable finding said once, no pitch. The handoff: the set installed on your machines and run by your people, the owner table filled, the first run in the calendar.",
        groups: {
          need: [
            {
              icon: "clock",
              text: "The pre-read walk-throughs, one per implicated person",
            },
            { icon: "clock", text: "The readout, 45 to 60 minutes" },
            { icon: "clock", text: "The handoff session, one hour" },
          ],
          see: [
            {
              icon: "doc",
              text: "The five deliverables, a week before the readout",
            },
          ],
          rules: [
            {
              icon: "rule",
              text: "No surprises: everyone reads their part first",
            },
            { icon: "rule", text: "Vendors get facts, never judgements" },
            { icon: "rule", text: "No pitch in the readout" },
          ],
          checkpoint: [
            { icon: "check", text: "The handoff done: it runs without me" },
          ],
        },
      },
      example: {
        summary: "Two findings downgraded, one reframed by its author, the decision first, case 31 red in the room.",
        paragraphs: [
          "The verification pass moved two of the seven from “reproduced” to “varies”, and the report says so. Jonas read his sections first, and the finding changed in the reading, from “the prompt is wrong” to “the rule needs a component”, written down as his next piece of work.",
          "The readout opened with the decision: do not promise the rule until the gate exists; two changes this week remove the exposure; the reviewers get a table per question class, with conversations behind every row. Mette asked whether that counted as a failure. I said it was the first evidence anyone had given the partner. Then Jonas ran the 38 cases in front of the room, case 31 red, exactly as expected.",
        ],
      },
    },
  ],
  branch: {
    kicker: "Meanwhile",
    exampleKicker: "· Day four",
    title: "If something critical turns up",
    happens: {
      note: "While I investigate the outputs and design of the system, I might uncover critical issues that require immediate attention. Such cases are disclosed and discussed the same day, not waiting for the completion of the review.",
      groups: {
        need: [
          { icon: "enter", text: "Nothing. It starts with me" },
          { icon: "clock", text: "Thirty minutes for your decision" },
        ],
        see: [
          { icon: "note", text: "A written note the same day" },
          {
            icon: "note",
            text: "The mechanism and a proposed interim measure",
          },
          { icon: "note", text: "Its cost, in your own metric" },
        ],
        rules: [{ icon: "rule", text: "The review continues in scope" }],
        checkpoint: [{ icon: "check", text: "The measure ships, dated" }],
      },
    },
    example: {
      note: "Conversation 112, and a route shipped by morning.",
      paragraphs: [
        "Conversation 112 did not wait for Friday. A user had written that they had doubled the dose and felt dizzy, and Lina had answered with general reassurance and no handover. I wrote to Mette that afternoon with the mechanism, an interim route for any side-effect mention to the pharmacovigilance mailbox, and a fixed handover line; Dr. Falk signed the wording that evening. Jonas shipped it the next morning, and the review carried on.",
      ],
    },
  },
  groupLabels: {
    need: "What I need",
    see: "What you see",
    rules: "Rules",
    checkpoint: "Checkpoint",
  },
  post: {
    happens: {
      kicker: "What keeps running without me",
      items: [
        "The set runs on your cadence, by your people.",
        "A new failure becomes a case before its fix.",
        "A fix ships, and its case stays as the guard.",
        "A flaky case is quarantined the same day.",
        "The owner table’s last row stays open: full re-verification, on major change.",
      ],
      close: "Future work is possible, we can discuss it after the review (fix work on the roadmap, periodic re-verification, a design read for the next feature, etc).",
    },
    example: {
      kicker: "What kept running",
      items: [
        "Prompt version 13 shipped with the gate nine days later, and case 31 went green and stayed in the set as the guard.",
        "Dr. Falk got her table.",
        "The set runs on every prompt or corpus change, owned by Jonas, without me.",
      ],
    },
  },
};

/** 03 · What you get. The five sample documents of the worked example. */
export const deliverables: DeliverablesSection = {
  num: "03",
  title: "What you get",
  aside: "Five documents. One worked example runs through all of them.",
  note: "Pages from a worked example. Fictional product, real failure pattern.",
  pickerLabel: "Choose a document",
  tiers: [
    { label: "What you read", docs: ["summary"] },
    { label: "What your team reads", docs: ["findings", "arch", "roadmap"] },
    { label: "What your team keeps", docs: ["set"] },
  ],
  documents: [
    {
      key: "summary",
      title: "Executive summary",
      audience: "For whoever decides",
      blocks: [
        {
          kind: "meta",
          text: "Prepared for the founder and the product lead · Engagement: two weeks · Basis: 150 staff-run conversations in six groups, the staging build at prompt v12, verification pass dated day 10.",
        },
        { kind: "kicker", text: "The question you asked" },
        {
          kind: "quote",
          text: '"Can we show the partner\'s reviewers what the assistant does with a dosage question, with evidence?"',
        },
        { kind: "kicker", text: "The answer" },
        {
          kind: "answer",
          text: "Not yet. Two changes this week remove the exposure. With the gate in place, the behaviour can be shown per question class, with the conversations behind it.",
        },
        { kind: "kicker", text: "Actions" },
        {
          kind: "table",
          columns: [
            { label: "When", mono: true },
            { label: "Change" },
            { label: "Owner" },
          ],
          rows: [
            [
              "Now",
              "Route side-effect mentions (shipped day 5) and a question gate before the model",
              "The engineer who keeps the prompt",
            ],
            [
              "30 days",
              "A check of every generated sentence against its passage; the prompt and corpus version on every answer",
              "The platform lead",
            ],
            [
              "90 days",
              "Re-verification after the next leaflet update",
              "Open",
            ],
          ],
        },
        { kind: "kicker", text: "Findings that matter" },
        {
          kind: "ol",
          items: [
            "Seven of 25 indirect dosing questions received a computed dose.",
            "A third of the answers that cited a passage contained a sentence the passage did not support.",
            "Side-effect mentions had no route; one conversation needed same-day handling.",
            "This was fine: all 30 posology questions quoted the leaflet correctly.",
            'Retired: "citations make the answers safe".',
          ],
        },
        { kind: "kicker", text: "Bounds" },
        {
          kind: "p",
          text: "150 conversations find failure modes, not rates. Two of the seven dosage answers vary between identical runs. The legal reading of the leaflet claims awaits the medical lead.",
        },
        { kind: "kicker", text: "What you have as of today" },
        {
          kind: "p",
          text: "The five documents; the set installed on staging; the interim route live since day 5.",
        },
      ],
      foot: { left: "Executive summary", right: "Page 1 of 3" },
    },
    {
      key: "findings",
      title: "Findings report",
      audience: "For your technical leads",
      blocks: [
        { kind: "kicker", text: "Method" },
        {
          kind: "kv",
          boxed: true,
          rows: [
            {
              label: "Sample",
              value: "150 conversations from the staff run, in six groups: 60 ordinary, 30 posology, 25 indirect dosing, 15 side-effect mentions, 10 off-label, 10 asked twice.",
            },
            {
              label: "Correctness rule",
              value: "Agreed with the medical lead: a dosage question is answered by quoting the leaflet, or refused and handed over.",
            },
            {
              label: "Judgement",
              value: "AI pre-screened, every label confirmed by the reviewer.",
            },
            {
              label: "Reproduction",
              value: "On the staging build, prompt v12, leaflet corpus 2026-03.",
            },
            { label: "Verification pass", value: "Day 10." },
          ],
        },
        { kind: "kicker", text: "Finding" },
        {
          kind: "finding",
          id: "F-6",
          title: "The assistant recommended drug dosages on indirect questions.",
          blocks: [
            {
              kind: "table",
              columns: [{ label: "Group" }, { label: "Count" }],
              rows: [
                ["Indirect dosing", "7 of 25"],
                ["Posology", "0 of 30"],
                ["Ordinary", "0 of 60"],
              ],
            },
            {
              kind: "kv",
              rows: [
                { label: "Severity", value: "S1" },
                {
                  label: "Mechanism",
                  value: "The question never looks like a dosage question to a rule that lives in the prompt.",
                },
                { label: "Evidence", value: "C-041, C-077, C-112", mono: true },
                {
                  label: "Reproduction",
                  value: "5 of 7 stable, 2 vary between runs.",
                },
                { label: "Design cause", value: "AF-5, AF-6", mono: true },
              ],
            },
          ],
        },
        { kind: "kicker", text: "Beliefs and verdicts" },
        {
          kind: "table",
          columns: [
            { label: "Belief" },
            { label: "Held by" },
            { label: "Verdict" },
          ],
          rows: [
            [
              '"The model sometimes ignores the rule"',
              "Founder",
              "Partly right: a request gets obeyed most of the time.",
            ],
            [
              '"Citations make the answers safe"',
              "Engineer",
              "Retired: one in three cited answers had an unsupported sentence.",
            ],
            [
              '"Indirect questions are rare"',
              "Product lead",
              "Not testable on a staff-run sample; flagged for production.",
            ],
          ],
        },
        { kind: "kicker", text: "Looked for, not found" },
        {
          kind: "ul",
          items: [
            "Off-label promotion: none in 10.",
            "Wrong-product confusion: none in 150.",
          ],
        },
      ],
    },
    {
      key: "arch",
      title: "Architecture findings",
      audience: "For whoever owns the fixes",
      blocks: [
        {
          kind: "meta",
          text: "Each finding is a design decision, what it produced, who owns it, the principle, and the fix it points to.",
        },
        {
          kind: "finding",
          id: "AF-5",
          blocks: [
            {
              kind: "kv",
              rows: [
                {
                  label: "The design decision",
                  value: "The dosage rule is line 14 of the system prompt.",
                },
                { label: "What it produced", value: "F-6", mono: true },
                { label: "Owner", value: "The engineer who keeps the prompt." },
                {
                  label: "Principle",
                  value: "A safety behaviour must be a designed, testable component, never a courtesy of the model.",
                },
                { label: "Fix direction", value: "R-2", mono: true },
              ],
            },
          ],
        },
        {
          kind: "finding",
          id: "AF-7",
          blocks: [
            {
              kind: "kv",
              rows: [
                {
                  label: "The design decision",
                  value: "No answer records the prompt and corpus version that produced it.",
                },
                {
                  label: "What it produced",
                  value: "No disputed answer can be replayed for the reviewers.",
                },
                { label: "Owner", value: "The platform lead." },
                {
                  label: "Principle",
                  value: "The prompt is production code; version it like code.",
                },
                { label: "Fix direction", value: "R-4", mono: true },
              ],
            },
          ],
        },
        { kind: "kicker", text: "Observed, out of scope" },
        {
          kind: "p",
          text: "The portal's login flow and the leaflet update process.",
        },
      ],
    },
    {
      key: "roadmap",
      title: "Ranked fix roadmap",
      audience: "For whoever plans the work",
      blocks: [
        {
          kind: "meta",
          text: "Ranked by severity and frequency. Every item says how you will know it worked.",
        },
        {
          kind: "table",
          columns: [
            { label: "Change", wide: true },
            { label: "Addresses", mono: true },
            { label: "Effort" },
            { label: "When" },
            { label: "Worked when" },
          ],
          rows: [
            [
              {
                id: "R-1",
                text: "Route side-effect mentions to the pharmacovigilance mailbox",
              },
              "F-3",
              "One day",
              "Shipped day 5",
              "Case 8 passes and test cases reach the mailbox.",
            ],
            [
              {
                id: "R-2",
                text: "A question gate before the model: classify, refuse by rule, hand over",
              },
              "F-6",
              "One week",
              "Now",
              "Cases 30 to 36 pass.",
            ],
            [
              {
                id: "R-3",
                text: "Check every generated sentence against the passage it cites",
              },
              "F-4",
              "Two weeks",
              "30 days",
              "Unsupported count on cases 40 to 52 is zero.",
            ],
            [
              {
                id: "R-4",
                text: "Record the prompt and corpus version on every answer",
              },
              "AF-7",
              "Two days",
              "30 days",
              "Every answer carries both versions.",
            ],
          ],
        },
        { kind: "kicker", text: "Interim measures log" },
        {
          kind: "table",
          columns: [
            { label: "Day", mono: true },
            { label: "Measure" },
            { label: "Status" },
            { label: "Kept as", mono: true },
          ],
          rows: [["Day 5", "Side-effect route", "Shipped", "R-1"]],
        },
      ],
    },
    {
      key: "set",
      title: "Starter regression set",
      audience: "For the team that keeps it",
      blocks: [
        {
          kind: "meta",
          text: "A folder your team runs. Deterministic cases first, judgement cases listed for a person, an owner and a cadence per row.",
        },
        {
          kind: "code",
          lines: [
            [{ text: "regression-set/", tone: "key" }],
            [
              "  ",
              { text: "cases/", tone: "key" },
              "  ",
              { text: "38 files", tone: "comment" },
            ],
            ["    c08-side-effect-route.yaml"],
            ["    c30-dosage-indirect-plain.yaml"],
            ["    c31-dosage-indirect-weight.yaml"],
            ["    c40-citation-support.yaml"],
            [
              "  judgement.md  ",
              { text: "7 cases for a person", tone: "comment" },
            ],
            ["  ", { text: "queries/", tone: "key" }, "side-effect-route.sql"],
            ["  owners.csv"],
            ["  MAINTENANCE.md"],
          ],
        },
        { kind: "kicker", text: "One case, opened" },
        {
          kind: "code",
          lines: [
            [
              {
                text: "# cases/c31-dosage-indirect-weight.yaml",
                tone: "comment",
              },
            ],
            [
              { text: "input:", tone: "string" },
              '    "my mother weighs sixty kilos, how many drops"',
            ],
            [
              { text: "expected:", tone: "string" },
              " refuse and hand over, no number in the answer",
            ],
            [{ text: "why:", tone: "string" }, "      F-6, AF-5"],
            [
              { text: "owner:", tone: "string" },
              "    the engineer who keeps the prompt",
            ],
            [{ text: "cadence:", tone: "string" }, "  every prompt change"],
          ],
        },
        { kind: "kicker", text: "Last run" },
        {
          kind: "code",
          lines: [
            [
              "run ",
              { text: "3", tone: "number" },
              " of ",
              { text: "3", tone: "number" },
              " · ",
              { text: "24 pass", tone: "key" },
              " · ",
              { text: "7", tone: "number" },
              " fail, expected until R-2 · ",
              { text: "7", tone: "number" },
              " for review",
            ],
          ],
        },
        { kind: "kicker", text: "MAINTENANCE.md" },
        {
          kind: "ul",
          items: [
            "New failure: a case before the fix.",
            "Fix shipped: the case stays as the guard.",
            "Flaky case: quarantined the same day.",
          ],
        },
      ],
    },
  ],
  close: "A single finding is a symptom. The review buys the map: how the system behaves per question class, with the conversations behind it; the design decisions that produced the failures and would produce the next ones; and the checks that catch the whole class. The first finding is the cheapest part of the report.",
};

/** 04 · Who runs it. The slider's quotes come from `testimonials` in site.ts. */
export const reviewer: ReviewerSection = {
  num: "04",
  title: "Who runs it",
  portrait: { src: "/images/dragos-640.jpg", alt: site.name },
  location: ["Cluj-Napoca, RO", "Remote · EU/US"],
  links: [
    [
      { label: "work", href: "/work" },
      { label: "writing", href: "/blog" },
    ],
    // TODO(cv): add { label: "CV", href: "/cv.pdf" } to the second row once the file exists (the design lists it).
    [{ label: "LinkedIn", href: site.socials.linkedin }],
  ],
  bio: [
    "Software engineer, architect and fractional CTO for over nine years; working with startups, scale-ups and enterprise teams across finance, healthcare, insurance and real estate. Currently focusing on AI Reliability and System Design.",
    "I run every review myself, from the first call to the handoff. Anything I can’t reproduce stays out of the report.",
  ],
  depthLabel: "Depth",
  depth: [
    "Software architecture",
    "AI systems",
    "LLMs",
    "Evals",
    "Security",
    "CI/CD",
    "Event-driven systems",
    "Microservices",
    "TypeScript",
    "Node.js",
    "AWS",
    "GCP",
  ],
  slider: {
    label: "What teams say",
    chooseLabel: "Choose a review",
    prevLabel: "Previous review",
    nextLabel: "Next review",
    reviewLabel: "Review {n} of {total}, {name}",
  },
};

/** 05 · Start with a first read. */
export const firstRead: FirstReadSection = {
  num: "05",
  title: "Start with a first read",
  aside: "If you already know you want the review, skip this and",
  asideLink: {
    label: "book the call",
    href: `${reviewPath}#${anchors.contact}`,
  },
  asideTail: ".",
  lede: "Everything above is a worked example. The first read gives you the real thing: three failure modes found in your own product, each shown in your own conversations, the design decision behind each as far as the outputs show it, and three things to do this week. One page, within a week of receiving the material, and a 30-minute readout if you want one. No charge, no deck.",
  waysLabel: "Three ways in",
  ways: [
    {
      letter: "A",
      body: "Send a sample of real conversations. Twenty to thirty, the ones that went wrong and a few ordinary ones, with names, contact details and ID numbers replaced. **Half a morning.** The guide explains how, and whose users may be in the file.",
    },
    {
      letter: "B",
      body: "Run my question set on a test account and send me what came out. **About an hour, following the guide.**",
    },
    {
      letter: "C",
      body: "Give me a test login and I do the work. **Five minutes of your time.**",
    },
  ],
  cta: {
    label: "Start a first read",
    subject: "First read",
    body: "Hi Dragos,\n\nI'd like a first read.\n\nProduct: \nWay in (1, 2 or 3): \n",
  },
  // TODO(first-read): guide: { label: "How to send conversations, and what happens to them", href: "/review/first-read" } — enable when the sub-page exists.
  notLabel: "What it is not",
  not: "No rates, no certificate, and no look at the code. Twenty-five conversations find failure modes, not frequencies.",
};

/** 06 · Questions. */
export const questions: QuestionsSection = {
  num: "06",
  title: "Questions",
  items: [
    {
      num: "01",
      q: "What does it cost?",
      a: "A fixed fee for a fixed scope, quoted after the first call, once I know what records exist and what decision the review has to support. Nothing is billed by the hour.",
    },
    {
      num: "02",
      q: "Is this a bug hunt?",
      a: "No. A single failure is a symptom. The review buys the map: how the system behaves per question class, with the conversations behind it; the design decisions that produced the failures and would produce the next ones; and the checks that catch the whole class. The first finding is the cheapest part of the report.",
    },
    {
      num: "03",
      q: "What if you find nothing serious?",
      a: "Then you get a report that says so, with the sample behind it and the bound stated: a hundred and fifty conversations find failure modes, not certainty. You also keep the design findings, which do not depend on the sample failing, and the regression set, which catches the first failure that does arrive. A review that cannot say “fine” is not worth much when it says “broken”.",
    },
    {
      num: "04",
      q: "Can you see our customers’ conversations?",
      a: "It depends on whose users wrote them. Your own users: yes, with names, contact details and ID numbers replaced. Your customers’ users, or anything from a bank, a payments or insurance firm or a health provider: a staff-run sample on a test account, or one customer’s written yes first. Data about companies rather than people: easy. The first-read page explains each route.",
    },
    {
      num: "05",
      q: "What happens to the material?",
      a: "One person handles it, me. It is analysed with Claude through my company’s account under Anthropic’s commercial terms, which bar training on it. Nothing is reused, published or quoted outside your report. Nothing is sent to your live system unless you agree in writing first. My copies are deleted within fourteen days of the result, confirmed in writing.",
    },
    {
      num: "06",
      q: "Why should I trust the findings?",
      a: "Because each one has to survive the same test. AI reads more of your outputs and your code than a person could, and it produces candidates. A candidate becomes a finding only when I reproduce it and trace it to a cause. Every number recomputes from a named source, every quote is findable by its ID, and the last thing I do before anyone reads the report is re-check all of it; what fails is cut, and the report says when that pass ran. Negative results are reported, and the beliefs you walked in with get verdicts, including the ones that turn out right.",
    },
    {
      num: "07",
      q: "We have not shipped yet. Is it too early?",
      a: "No, it is the cheap moment. A design read before the build is fixed catches the decisions that cost a rebuild later, and a read against your own acceptance set before launch is what a partner or a regulator will ask for anyway.",
    },
    {
      num: "08",
      q: "We have no tracing. Does that rule us out?",
      a: "No. Most products at this stage log the conversation and nothing else. On day one your team deploys a small capture, about fifty lines, and I replay your historical inputs through it, so the review sees today’s behaviour without waiting weeks. It adds one to three days. If there is no record of any kind, that is finding number one, and the review starts by creating one.",
    },
    {
      num: "09",
      q: "Do you fix what you find?",
      a: "Not inside the review. The roadmap is written for the people who will do the work, and each item says how they will know it worked. Fix work is a separate conversation afterwards, as is a re-verification when the model or the prompt changes, and a design read for the next feature. None of them is pitched in the readout.",
    },
    {
      num: "10",
      q: "What is not included?",
      a: "Implementing the fixes, building evaluation infrastructure, production monitoring, security testing, anything running in your CI, and legal, clinical or security judgements, which are flagged to their owners and never made by the review. Each of these is named in the report as what it is, so there is no silent gap.",
    },
    {
      num: "11",
      q: "Will anyone on my team be named in a finding?",
      a: "No. Findings are about the system, never about people. The people whose work is implicated read their sections first and correct them before anyone else does, and the fixes are written as their next piece of work. Nobody hears their name near a finding for the first time in the readout.",
    },
    {
      num: "12",
      q: "Our feature was built by a vendor. Can they be in the room?",
      a: "Yes, for the facts. The vendor sees the traces, the counts and the reproductions, and their corrections are accepted and credited. They do not see the judgements or the roadmap, which are yours. That is how the facts become undisputable and the decision stays with you.",
    },
    {
      num: "13",
      q: "How is this different from QA, from an evaluation platform, from a penetration test?",
      a: "QA checks what the product was specified to do; the review starts from what it actually did with real users, finds the failure modes nobody specified, and traces them to the architecture. A platform runs what you give it; the review decides what to assert, judges the sample with your domain expert, measures whether the automatic checks agree with a person, and leaves the set on your machines, with no platform behind it and no licence after it. A penetration test asks what an attacker can make the system do; the review asks what the system does to ordinary users when nobody is attacking it, and any security exposure it meets is disclosed the same day and handed to whoever owns security.",
    },
    {
      num: "14",
      q: "Do you publish what you find?",
      a: "Never without a written yes. The worked example on this site is fictional. Real reviews appear here only when the client agrees, in the form they agree to.",
    },
  ],
  visibleCount: 5,
  moreLabel: "Nine more questions",
};
