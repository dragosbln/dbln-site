---
title: "Did it check, or did it guess? Testing a tool whose output is written by an LLM"
date: "2026-07-18"
tags: ["ai", "agents", "testing"]
excerpt: "My first AI tool worked, or at least the output looked right when I ran it. Then I pictured a client asking what makes it trustworthy: did it check, or did it guess? This is how I built a real answer, and how designing the output for testing made the tool harder to lie with."
cover: "/blog/covers/testing-ai-tools.svg"
coverAlt: "A vertical gauntlet of four numbered checking layers (shape, invariants, expectations, agreement); the tool's output runs down through all four as a single teal thread and exits verified, while a muted side path marks the one paid live run that also feeds the same layers."
# TODO(dragos): add the dev.to URL of this article's cross-post (devto: "…")
---

My first AI tool was ready, and in typical AI-era fashion, I rushed to publish it. After all, it worked. Or at least when I ran it, the output looked right to me.

But one scenario kept haunting me: I recommend it to a client, they run it and challenge one of its findings. Then they ask "What makes it trustworthy? Did it check, or did it guess? How do you know?" I didn't have a good answer. "My prompt was really good" - not quite what you'd expect from a senior architect.

This article is about building a better answer, and how building it changes the tool itself.

## The subject: one niche tool, one generic pattern

I built an AI tool for auditing calcification in production auth systems. Its purpose stems from a real-world problem I encountered while working on a large-scale platform, which I described in [Part 1](/blog/securing-auth-large-scale-production-system). After dealing with it, I formulated some generalized principles in [Part 2](/blog/future-proof-auth-architecture), and based on those principles, I built the tool in [Part 3](/blog/designing-honest-ai-tools).

Long story short: the tool is a skill published for Claude Code. It audits a codebase and evaluates how hard-wired the auth implementation is to its vendor's defaults, across multiple axes (token storage, refresh handling, provider coupling, authorization). It then runs an interview with the user for the judgment calls, and combines everything into its final deliverables. When this story begins, those deliverables were 2 markdown files: a full report and a one-screen summary, presenting the findings, the risks and the recommended next steps.

While the tool and the previous 3 articles are good for context, this article is meant to be a standalone piece on the issues you'd usually encounter when thinking about testing AI tools and skills. The auditor is just a convenient example, since its output mixes everything that makes AI hard to test: mechanical findings, judgment calls and prose. 

If your tool makes claims about something checkable (a codebase, a document base, a dataset), the pattern is the same, and the vocabulary transfers: my enums are your classification fields, my file-and-line evidence is your citations, my coverage section is your scope statement.

![fig. one audit run: a mechanical pass that confirms every candidate, judgment only the maintainer can supply, and two markdown files at the end.](/blog/testing-ai-tools/audit-pipeline-v1.svg)

## Where v1 left testing

In the initial version, I built 4 adversarial fixtures, meant for testing recall (does it find what's there?), precision (does it stay quiet when nothing's there?), generalization (does the methodology travel across vendors?) and edge cases. These are described in more detail [here](/blog/designing-honest-ai-tools#i-tested-it-before-trusting-it).

I ran the tool against these fixtures and manually verified the results. These already provided a good feedback loop I could iterate on. After implementing the initial batch of fixes, I ran the skill against real codebases, and real code did what real code does: it found the gaps my fixtures hadn't imagined.

I caught the skill confidently lying about findings. The most memorable one: the tool's vendor knowledge documented how token storage is configured in v6 of the vendor's library, but the codebase ran v5, where storage is configured through a completely different shape. The model searched for the v6 pattern, found nothing, and reported "default storage: localStorage", while the cookie configuration sat in plain sight, in a shape the tool had never been taught. A confident claim of absence, wrong, on the most basic axis the tool reports on (full story [here](/blog/designing-honest-ai-tools#it-lied-to-me-on-the-first-real-run)).

I also caught it behaving differently from run to run, especially when switching models: the same fixture rating a boundary signal as "present" on one run and "partial" on the next, or a smaller model missing a storage pattern that a bigger one caught.

A more thorough testing layer was already on the table, but these runs made its necessity all the more obvious.

## Thinking about testability changed what the tool ships

Recall from the first diagram: the tool was initially designed to produce 2 markdown files, both following a consistent structure, but in freeform text. This makes mechanical testing nearly impossible. Any relevant check immediately requires another LLM call (LLM-as-judge), which means paying for every test run.

I wanted to maximize the value of free, mechanical testing, which meant changing the output of the skill into something more testable. The immediate solution: a structured JSON as the primary output. The skill now delivers 3 artifacts, the JSON being the canonical one, with the 2 markdowns rendered from the JSON alone.

There's a second win in this ordering, beyond cheap testing. The model now has to commit its claims (statuses, classifications, evidence) into strict fields before it writes any narrative around them. A confident story can no longer gloss over an unverified claim, because the claim got pinned down first, in a checkable format.

I also introduced a rule that completed the rendering setup: if the model notices mid-render that the prose wants to say something the JSON doesn't support, the fix goes into the JSON first, and the view gets re-rendered from it; the views never fork from the source.

![fig. the output, rewired: claims committed to a canonical JSON first, both markdowns rendered from it alone.](/blog/testing-ai-tools/output-rewired.svg)

This was not enough to enforce the "rendered from the JSON alone" rule, though. The render step runs in the same context that produced the analysis, so nothing physically stops a detail from leaking past the JSON into the prose. The airtight version would render the markdowns in a fresh session that receives only the JSON. I deferred it, opting instead for a cheaper mechanism that polices the same risk: an agreement check between the markdowns and the JSON, coming up with the harness.

## Won't structure kill the value?

A genuine question to ask. The unique value of AI sits in its ability to generate answers that are hyper-personalized to real-world contexts. A clear structure removes some of the non-determinism that makes AI hard to test, but it also risks flattening the exact specificity that made the answer worth reading. The secret lies in how you design the JSON to account for this risk.

A bad structure makes AI force reality into predefined boxes, without considering whether reality can outrun them (spoiler: it almost always does). A better structure splits the output into registers:

- Some of the output is **claims**: statuses, classifications, evidence references. Facts that fit a strict shape and can be asserted.
- Some of it is **explanation**: why a finding matters, what it costs you if it stays. This part stays freeform, and no test ever asserts on it.
- Some of it is **synthesis**: the headline, the overall posture. Written freely, but recorded in the JSON next to the findings it draws on, so even the editorial layer stays anchored to claims.

The contract becomes:

> _The markdowns may say **more** than the JSON, but never **different**._

## Designing boxes, where boxes are warranted

The JSON structure enables the next move, which actually makes AI output testable: assertable enum fields. Some parts of the output can fit in boxes that we can later use to verify the accuracy of the tool after we change something in its instructions.

For the auth auditing tool, we can say an auth boundary is either present, partial or absent, which translates into the JSON field: `authBoundary: "present" | "partial" | "absent"`. Similarly, auth token storage can be classified and fit in a box: `tokenStorage: "vendor_default" | "builtin_selector" | "custom_adapter"`. (Field names simplified throughout; the real schema nests these per vendor.)

At this point, there is an important distinction to be made. The boxes (or enums) can be of 2 types:

- **Logically exhaustive** enums, that cover all cases by construction: `"present" | "absent"`, `"low" | "moderate" | "high"`. A claim is one or the other. Safe to use directly in the JSON.
- **Empirical taxonomies** are catalogs of patterns observed _so far_. From what we've seen, token storage can either be `"vendor_default" | "builtin_selector" | "custom_adapter"`. But nothing guarantees the wild won't produce a fourth pattern. Forcing the AI model to pick one of these values anyway produces one of the worst kinds of failure modes: a structured lie that looks even more authoritative than a prose one.

To mitigate this risk, 2 new values are helpful:

- `"other"`, with the meaning "I understand this pattern, it's just not listed in the options". To keep the hatch honest, "other" comes with obligations: a required `note` field where the model describes the pattern in its own words, plus (like any determined verdict) at least one cited finding.
- `"undetermined"`, carrying the meaning "I couldn't tell". This one pairs with a required entry in the coverage section, the part of the report that lists what wasn't analyzed and why. An "I couldn't tell" that doesn't surface there would be a silent shrug; paired with a coverage gap, it becomes a signal the reader can act on.

The first line of enforcement sits in the schema itself, where breaking an obligation is a shape error:

```json
"classification": { "enum": ["vendor_default", "builtin_selector", "custom_adapter", "other", "undetermined"] },
"allOf": [
  { "if":   { "properties": { "classification": { "const": "undetermined" } } },
    "then": { "required": ["note"] },
    "else": { "properties": { "finding_ids": { "type": "array", "minItems": 1 } } } },
  { "if":   { "properties": { "classification": { "const": "other" } } },
    "then": { "required": ["note"] } }
]
```

The two hatches also attach at different levels, because they cover different failure modes. "other" covers a vocabulary failure: the model understood the pattern, my enum didn't. It only belongs on empirical taxonomies. "undetermined" covers an epistemic failure: the looking itself failed. That one belongs on any verdict the model has to detect, even the logically exhaustive ones (boundary status, for example, is a complete vocabulary: present, partial or absent. It still carries "undetermined", because a complete vocabulary doesn't guarantee the model can always reach a verdict).

So, our previous case now becomes: `tokenStorage: "vendor_default" | "builtin_selector" | "custom_adapter" | "other" | "undetermined"`. This way, our tool remains testable on the fixtures (we know the calcified fixture must always produce `"vendor_default"`; an `"other"` there is a test failure, since fixtures are built from known patterns), while staying prepared for the world _wild_ web.

## Receipts, search records, and DRY fields

Three more structural rules round out the JSON, each one buying a specific kind of checkability.

Presence claims carry **verbatim-quoted references**. Besides anchoring the model in the reality it's analyzing, these references can be mechanically checked with zero extra LLM calls: open the file, go to the line, compare the quote.

```json
{
  "id": "boundary-cognito-authport-interface",
  "claim": "presence",
  "statement": "An `AuthPort` interface defines the auth boundary contract used by the new Cognito surface.",
  "evidence": [
    { "file": "src/auth/port.ts", "line": 6, "quote": "export interface AuthPort {" }
  ]
}
```

Absence claims carry `checked_patterns`, their **search records**, which makes them auditable. Not as easy to check as grep-ing the references from the presence claims, but still mechanically valuable: a test can assert that the record covers every alternative pattern the vendor profile lists, and for live runs we get a track record instead of a vague "nothing's there" report. This is the rule aimed straight at the localStorage lie from earlier. The failure mode isn't gone (a model can still miss a pattern), but it can no longer happen in silence.

```json
{
  "id": "boundary-no-contract-suite",
  "claim": "absence",
  "statement": "No contract test suite exercises the `AuthPort` shape; the audited scope contains no test files of any kind.",
  "checked_patterns": [
    "*.test.ts / *.test.tsx",
    "__tests__/ directories",
    "runAuthContractTests-style suite name",
    "vitest.config.* / jest.config.*",
    ...
  ]
}
```

**Normalization**: every fact is stated once. Counts are computed from the arrays, a rank is the array order, no derived fields get stored. This is the LLM flavor of the everlasting principle of DRY (Don't Repeat Yourself): anything stated twice can self-disagree within the same document.

The resulting artifact was an `audit-schema.json` file that specified the structure of the JSON output in great detail. [You can inspect it here](https://github.com/dragosbln/auth-calcification/blob/ef4304c524f090b0a84dea3e05a78d3c6a0e8a66/skill/auth-calcification-audit/skills/auth-calcification-audit/assets/audit-schema.json).

## The harness: 4 free layers in front of every paid run

With the output redesigned, the testing layer could take shape. The guiding principle: cheapest feedback first.

Before writing any checks, I produced a golden file: a hand-written example of what a perfect audit JSON looks like for one fixture. I used the old, manually-approved report and translated it backwards into the new schema. Backwards-translation paid for itself before a single line of harness code existed. It exposed issues on both sides, in the old report's data and in my new schema:
- roughly half the anchors (code references) were broken, citing the wrong lines from the codebase;
- real findings cite multiple locations, so evidence had to become an array;
- some concerns simply don't arise in a given codebase, so `not_applicable` had to exist;

I addressed these initial findings. Then came the checks. 4 deterministic layers, stacked in front of any LLM involvement:

1. **Shape.** The audit JSON is validated against the exact schema file that ships with the skill.
```ts
// read from the skill package directly, never copied into the harness:
// the schema the tests enforce is byte-for-byte the schema that ships
const SCHEMA_PATH = join(HARNESS_DIR, "../skill/.../assets/audit-schema.json");

export function validateShape(doc: unknown): string[] {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  const validate = ajv.compile(schema);
  if (validate(doc)) return [];
  return (validate.errors ?? []).map(formatError);
}
```
2. **Relational invariants.** Rules that connect fields across the document: every referenced finding id must exist; every evidence quote must verify verbatim against the audited code; every "other" must carry its note and finding; every "undetermined" its coverage gap. The tool's non-negotiables (never fabricate human judgment, never produce a false all-clear) live here too, encoded as cross-field implications instead of polite prompt requests.
```ts
// I4: every evidence quote must verify verbatim against the audited codebase
for (const f of doc.findings) {
  for (const ev of [...(f.evidence ?? []), ...(f.context_evidence ?? [])]) {
    // ... cited file must exist, cited line must be within the file ...
    const lines = readFileSync(join(codeRoot, ev.file), "utf8").split("\n");
    if (!lines[ev.line - 1].includes(ev.quote)) {
      const hits = lines.flatMap((l, i) => (l.includes(ev.quote) ? [i + 1] : []));
      err(
        `I4 ${f.id}: quote not at ${ev.file}:${ev.line}` +
          (hits.length ? ` (found at line [${hits}])` : " (found nowhere in file)"),
      );
    }
  }
}

// I6: one of the non-negotiables, encoded as a cross-field implication
if (interview === null && lik !== null) {
  err(`I6 axes.${axis}.likelihood is '${lik}' but interview is null (fabricated human axis)`);
}
```

3. **Fixture expectations.** Declarative ground truth: 87 assertions across the 4 fixtures, written in a tiny vocabulary (equals, oneOf, isNull, some), stating what each fixture must produce. The calcified fixture must classify storage as `"vendor_default"`. And my favorite: 2 of the fixtures have byte-identical app code, differing only in the vendor adapter, so all 13 of their enum-level verdicts must be equal. "The methodology travels across vendors" used to be a marketing claim; now it's a permanent test.
```json
{
  "fixture": "calcified-cognito",
  "assertions": [
    { "path": "axes.storage.per_vendor.<v>.classification", "equals": "vendor_default",
      "note": "THE original-bug axis: default localStorage, no custom adapter" },
    { "path": "boundary.<v>.b4_client_server_split.status", "equals": "not_applicable",
      "note": "no SSR surface — must be not_applicable, never a fabricated gap" },
    { "path": "backlog", "isNull": true, "note": "non-negotiable: no ranking without a human" },
    ...
  ]
}
```
(`<v>` resolves to the detected vendor's id at evaluation time; vendor ids are model-chosen and unstable across runs, so the paths never hardcode them.) The portability test is a spec file of its own:
```json
{
  "type": "structural_equality",
  "fixtures": ["bounded-cognito", "bounded-auth0"],
  "paths": [
    "boundary.<v>.b1_anti_corruption.status",
    "axes.storage.per_vendor.<v>.classification",
    "axes.authorization.per_vendor.<v>.api_token_type",
    ...
  ]
}
```
4. **Cross-format agreement.** The markdowns checked against the JSON: every file:line link in the views must resolve to evidence recorded in the JSON, the metadata must match, a disclaimer may only appear if the JSON says it fired. This is the mechanism that gives the JSON jurisdiction over what humans actually read (and the promised policing of "rendered from the JSON alone").
```ts
// every evidence anchor recorded in the JSON, as "file#line"
const anchors = evidenceAnchorSet(doc);

for (const { display, href } of extractLinks(md)) {
  const hrefLine = href.match(/^([^#]+)#L(\d+)$/);
  if (!hrefLine) continue; // whole-file links carry no line claim
  const [, hrefFile, line] = hrefLine;

  // a line-anchored link is a claim: its anchor must be backed by a JSON
  // evidence line, regardless of how the display text reads
  if (!anchors.has(`${cleanPath(hrefFile)}#${line}`)) {
    err(`A1 ${name}: anchor ${hrefFile}:${line} is not backed by any evidence anchor in the JSON`);
  }
  // ... display/href consistency is checked only when the display parses as a path:line ...
}
```

All 4 layers run in about 2 seconds, cost nothing, and are wired into a pre-commit hook. Editing a fixture's source code now breaks the commit if it invalidates any committed evidence anchor.

Live runs sit on top of this. The runner copies a fixture into a fresh workspace, invokes the actual installed skill headlessly, harvests the 3 artifacts and pushes them through all 4 layers, with the quotes verified against the exact code the model just audited. In the case of the auth auditing tool, one live run costs about $3 and 8 minutes. That number is the reason the free layers exist: with regular software you run the suite on every save; when every run sends you a bill, you want most of your testing to happen with no model in the loop.

![fig. the harness: four free deterministic layers on every commit; the model enters only through the paid live run, and its output lands in the same gauntlet.](/blog/testing-ai-tools/four-free-layers.svg)

One bootstrapping problem remains: who checks the checker? A suite that has only ever shown green proves nothing; maybe it approves everything. So before trusting it, I fed it mutants: deliberately corrupted copies of the golden file, one per failure class, and asserted that the tests go red when they should. Each mutant also declares which layer must catch it; a catch by the wrong layer fails the run too, so the layering itself is tested.

```ts
const MUTATIONS: Array<{ name: string; layer: Layer; apply: (d: Doc) => void }> = [
  {
    // the committed report's actual bug class: an off-by-N anchor
    name: "wrong_line",
    layer: "invariants",
    apply: (d) => (d.findings[6].evidence[1].line = 24),
  },
  {
    // 'high' is a legal enum value; the fabrication is only visible
    // cross-field (no interview to source it from). Shape-valid on purpose.
    name: "fabricated_likelihood",
    layer: "invariants",
    apply: (d) => (d.axes.storage.likelihood = "high"),
  },
  {
    // escape hatch used silently: 'other' requires a note
    name: "other_without_note",
    layer: "schema",
    apply: (d) => {
      d.axes.storage.per_vendor.cognito.classification = "other";
      delete d.axes.storage.per_vendor.cognito.note;
    },
  },
  // ... 21 mutants in total
];

for (const { name, layer: expected, apply } of MUTATIONS) {
  const doc = structuredClone(golden);
  apply(doc);
  // ... run the full checker against the mutant ...
  if (!caught) console.log(`MISSED       ${name}: mutant passed the full check`);
  else if (actual !== expected) console.log(`WRONG LAYER  ${name}: expected ${expected}, caught by ${actual}`);
  else console.log(`CAUGHT [${expected}] ${name}`);
}
```

This practice turned out to be especially useful because, as we shall see, writing tests for an AI tool is much more iterative than in traditional software development. A failing test doesn't automatically mean the instructions need to be fixed; often it's the test itself that has to change. And when tests change this often, a suite that tests the tests stops being a luxury. The mutants proved it in an unexpected way: when the schema later evolved, one mutant's "wrong" value silently became the new correct one, and the run flagged it as MISSED. Mutants encode the current contract and rot when the contract moves; the MISSED detector is what makes them safe to rely on.

## The pattern behind the layers

Notice where all the mechanical power comes from: the places where the model's output touches reality in a verifiable way. A quote either matches the file or it doesn't. A link either resolves to recorded evidence or it doesn't. A search record either covers the profile's patterns or it doesn't.

That's the generalizable move. Whatever your tool produces, find the spots where its free text makes contact with something verifiable (citations, quotes, identifiers, dates, links) and put your assertions there. You get deterministic tests inside prose you deliberately left free. 

If the output of your tool has no such contact points, treat that as a design smell in the output itself, and add some: a source citation per claim, an input-document quote per extracted fact, an id or URL per referenced record. The receipts pull double duty: they discipline the model while it generates (a claim that must carry its source is harder to invent), and they hand you deterministic checks afterwards.

Across the fixture campaign's live runs, this one mechanism verified 72 out of 72 evidence quotes verbatim against the audited code. Zero fabricated anchors.

## Who's wrong: the test or the tool?

Here's where testing AI diverges hardest from the TDD reflex. In regular software, the test is the fixed point: 2 + 2 equals 4, the assertion is correct, and if it fails, the code moves. With an AI tool, 2 + 2 sometimes comes back as "four". Or "quatro". A failing test no longer means the tool is wrong; it means the test and the tool disagree, and someone has to judge who's right. Updating the test stops being an admission of sloppy test-writing and becomes part of the design process itself.

To avoid the case where we fiddle with the tests until they pass, we need discipline in putting a clear verdict on every red run. Mine kept landing in one of 4 categories. Here they are, with real examples from the auditing tool:

1. **The test was a guess.** I had put maximum-length caps on the JSON's prose fields, sized by imagination against a single-vendor mental model. The 2-vendor fixture blew through them with dense, legitimate justification text. **Verdict:** the caps were guesses, calibrated by the wrong fixture in my head. Raised, with sharper field descriptions.

2. **The checker was naive.** Another test was built around the skill never estimating durations. Time estimates belong to the maintainer, that's one of the non-negotiables, so the harness flags any duration in the output. It flagged "24 months", but the string sat inside the skill's own interview question to the maintainer: "Is RBAC in your plan over the next 24 months?". **Verdict:** the rule was right, the checker applied it to the wrong voice. The no-durations rule binds the skill's voice; the human's recorded answers and the audited code's own strings (tokens legitimately expire in "30 days") are exempt.

3. **The model misbehaved.** Findings can be reused as evidence across different sections of the audit, and the schema originally required each finding to declare which sections cite it. The model kept reusing findings correctly while forgetting to declare the cross-reference. **Verdict:** tighten the prompt.

I improved the instructions and re-ran: the violations dropped from 4 to 2. Better prompting, still failing. Staring at that stubborn cross-reference bug, I realized it falls into a new category:

4. **The schema generated the failure.** The finding's declaration was a second copy of a relation the document already encoded (which sections cite the finding). Remember the normalization rule from above: I had banned stored counts and rank fields precisely because 2 copies of a fact can disagree. But then I stored this relation twice and built an invariant whose only job was checking that my 2 copies agree. The model wasn't failing the check; the schema was generating the possibility of failure. **Verdict:** delete the field. The relation now exists in exactly one place, the invariant shrank, and the failure became unrepresentable. No amount of prompt engineering was ever going to fix this reliably; the flaw was in the schema.

The rule that keeps the testing iteration process honest: a test only gets loosened after a verdict, never for convenience. Out of the 87 fixture assertions, exactly 1 is an allowed-set instead of an exact match: a boundary signal where 2 runs produced "present" and "partial", and re-reading the fixture showed both readings were defensible. That's the entire tolerance budget. By the end of the fixture campaign, every failure had landed in one of the 4 buckets.

## Breaking it on purpose

By this point the suite was green across all fixtures, which is exactly when a testing layer is most suspicious. A net that has never caught anything is indistinguishable from a net with a hole in it. So I ran a live demolition drill.

I took the verbatim-quote rule, the flagship honesty mechanism, and inverted it in all 6 places it appears in the skill's instructions ("quotes are readable paraphrases" instead of "quotes are verbatim"). Then I ran the free test suite.

All of the mechanical tests were green, as expected. Remember: the mechanical layers check artifacts (the output JSON and MDs), not the instructions of the skill. Since the skill didn't run yet, no output artifacts were modified.

Then came the live run that actually changed the output. Quote verification failed on all 35 evidence anchors across all 17 findings. "Found nowhere in file", 35 times. The flagship check caught the flagship failure class on its first real opportunity.

That's the division of labor to remember. Static checks guard the artifacts you already committed; only a live run can tell you whether the instructions still produce honest artifacts. Prompt-level rules are enforced at run time, or they're enforced nowhere.

## The real-world run

Fixtures can only take you so far. They're small by necessity (imagine committing a production-grade system as a subfolder of your test suite), and they're built from patterns I already knew about, which is precisely their limitation. The localStorage story taught me that real trouble comes in shapes nobody taught the tests. So once the fixture suite was green and drilled, I went looking for real code, and I used the AI itself to scout public repositories for a good candidate: production-flavored, actively maintained, on a current SDK version, exercising surfaces my fixtures couldn't (a real client/server split, among others).

Then I ran the whole thing the way a stranger would: installed the published plugin, pointed it at the cloned repo, ran the audit. After the audit finished, I ran the harness against the real-world output. Same schema check, same invariants, same quote verification, now against a codebase the tool had never seen. The run produced 14 findings, all of them verified verbatim.

2 things in this run were new. First, the "other" hatch fired for the first time, and fired correctly: the app constructs no Authorization header at all (token handling sits inside the vendor's data client), a real pattern outside my authorization enum. The model picked "other" and described the pattern in the note instead of rounding it to the nearest listed value. On a fixture that would be a failed test; on production code, it's the design doing its job.

Second, the agreement layer needed one last calibration. It reported 26 violations; 25 turned out to be the checker's fault (it assumed every link display is a `path:line`, while the model was writing richer displays over correctly backed anchors), and after the fix, the 1 that remained was genuine: a link pointing 1 line away from its recorded evidence. The tool's own honesty machinery, catching the tool's own imprecision, on real code.

After this last phase of testing and fixing, I could finally be a little more confident in the tool.

## Key takeaways

- **Design the output for testing, and the tool improves anyway.** A canonical JSON with views rendered from it forces the model to commit claims before writing the story around them.
- **Split the output into registers.** Assert the claims, leave the explanations free, anchor the synthesis. Structure where testing needs it, freedom where the value lives.
- **Only close an enum that's closed by construction.** Empirical taxonomies need "other" and "undetermined", and each hatch needs wired-in obligations (a note plus evidence, a coverage gap) so honesty stays cheaper than invention.
- **Assert where the output touches reality.** Quotes, references, search records: deterministic checks living inside freeform prose.
- **State every fact once.** When a model keeps failing to keep two copies of a fact consistent, stop storing two copies.
- **Put free layers in front of paid runs.** Schema, invariants, expectations, agreement on every commit; the $3 live runs only for what the free layers can't see.
- **Mutation-test your checks.** A suite that has only ever passed is unproven, and mutants rot when the contract moves, so detect that too.
- **Give every failed test a verdict.** Guessed test, naive checker, model behavior or schema flaw. Loosen nothing without one.
- **Know how each rule is enforced.** Prompt-level rules only exist at run time; static checks can't see them. Test each guarantee at the level where it actually lives.

## Closing

The skill is open source, and everything described here (the schema, the harness, the fixtures, the mutants, the decisions log this article was distilled from) is in [the repository](https://github.com/dragosbln/auth-calcification), runnable end to end.

I started this because I couldn't hand people a tool I had only eyeballed. I ended up with a tool that is structurally harder to lie with, and with a testing layer I would now build, in some form, for any AI tool meant to leave my machine. 

If you're building one of those, picture the moment this article grew out of:

_A client challenges one of your tool's outputs. What can you show them, beyond "it looked right to me"?_

If your team is building AI tooling and wants that kind of trust designed in, this is the sort of work I take on through Luckylabs. DMs open.
