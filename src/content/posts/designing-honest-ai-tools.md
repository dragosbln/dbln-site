---
title: "I designed an AI auth-auditing tool around honesty. On its first real run, it confidently lied to me."
date: "2026-06-25"
tags: ["ai", "agents", "auth"]
excerpt: "The tool was built to detect what it can verify and refuse to guess at the rest. On its first real run it confidently got the basics wrong. The fix had little to do with the prompt and almost everything to do with the structure around it."
cover: "/blog/covers/designing-honest-ai-tools.svg"
coverAlt: "An audit report whose claims are tethered to lines of code; one teal tether pins a claim to its exact evidence, while one dashed claim ends in air with no anchor"
# TODO(dragos): add the dev.to URL of this article's cross-post (devto: "…")
---

_How I rebuilt it so honesty and reliability were a structural constraint, not just a prompt request._

## It lied to me on the first real run

I spent days building an AI auth-auditing tool that detects what it can verify and refuses to guess at the rest. The whole point was to make it reliable, grounded, and honest. The first time I ran it on real production code, it told me with no hedge that the app stored its auth tokens in `localStorage`.

It doesn't. That frontend keeps them in cookies. I configured it that way myself.

My next thought was the obvious one: it said localStorage, but I put them in cookies, so what else is it lying about? A tool that's confidently wrong on the basics is worse than no tool, because it spends your trust and gives you nothing safe in return. Making it truly reliable became the priority.

This piece is about why it lied, the risk in building tools like this, and how I designed around that risk. The fix had little to do with the prompt and almost everything to do with the structure around it.

## How I got here

This is the third piece in a series on auth architecture in a large-scale production system. [Part 1](/blog/securing-auth-large-scale-production-system) laid out the consequences of calcification on a large auth system, which made a proper rewrite too risky and costly. In that context a deliberate, documented acceptance of a flawed state, paired with foundation work, was preferable. [Part 2](/blog/future-proof-auth-architecture) turned that into a defense: own the boundary and the volatile runtime behaviors instead of inheriting the vendor's, and noted that the coding agents which generate the calcified version by default are also the cheapest way to build the resilient one.

Part 3 takes that seriously. I built a skill that reads a codebase and reports how hard-wired its auth is to a vendor's defaults, and what a future change would cost. The bar was high because the skill ships publicly alongside this series, and my gold standard was a skeptical senior engineer reading through the output of the skill and trusting it.

## What the tool does

It audits one seam: the app-layer code that talks to your identity provider (Cognito, Auth0, or whatever you use), not the infrastructure or the gateway.

A system is calcified when a change that should be local becomes a cross-cutting rewrite. Swapping token storage, changing refresh, or replacing the provider should each touch one place; in a calcified system each touches dozens of call sites, making any meaningful changes to the system risky and costly.

The trouble is that code findings aren't enough. Calcification has to be evaluated in the real-world context of the project, its priorities, and the organization. That's why the tool needs to excel at detecting and classifying, but, more importantly, understand what it needs to escalate to human judgment — and do it!

Four non-negotiables enforce it:
- never fabricate the human axes;
- never produce a false all-clear, where "no finding" has to mean "looked and found nothing";
- report and propose, don't rewrite auth code;
- assess changeability, not security.

Stating them in the prompt was never going to be enough; the structure of the skill had to make them the path of least resistance, which is most of what the rest of this article is about.

## Avoiding calcification in an anti-calcification tool

There was one more constraint, and it turned out to be the series eating its own cooking: no vendor could be hard-coded. Provider knowledge lives in one markdown file per vendor, and the engine never names a vendor, so adding a third is writing one more file. Hard-coding Cognito into the core would have been the calcified version of my own anti-calcification tool.

A profile is just facts the vendor-agnostic core reads:

```markdown
## Token storage seam (vendors/amplify-cognito.md)

- Default storage: localStorage (in-memory fallback)
- Custom storage API: cognitoUserPoolsTokenProvider.setKeyValueStorage(storage)
- Look-alikes (NOT custom): built-in defaultStorage / sessionStorage / new CookieStorage()
```

## I tested it before trusting it

"I tried it once and it looked right" was not an acceptable stance, so before running it on anything real I built adversarial fixtures for distinct failure modes. A fully calcified codebase tests recall (does it find what's there?), a cleanly bounded one tests precision (does it stay quiet instead of inventing findings?), and the same bounded app on a second provider tests generalization (does the methodology travel?). I made generalization structural: the app-layer files in the two bounded fixtures are byte-for-byte identical (verified with `diff`), and only the adapter differs.

The fourth fixture is the interesting one. It stresses four things at once: two providers in the same repo, an unknown provider with no profile (which has to surface as a coverage gap, not vanish), a mid-migration boundary (the new side bounded, the legacy side calcified), and the look-alike storage trap. That last one is a built-in selector that reads like a custom storage adapter but isn't:

```ts
// Looks like owned storage. Isn't.
// A built-in selector chooses where tokens persist; it is not a custom adapter you own.
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
```

Crediting that as "owned storage" would be a confident, plausible, wrong finding. Running the fixture also forced two rules I had missed: assess multi-vendor and partial-boundary codebases per vendor instead of collapsing them to one verdict, and treat a real boundary with internal gaps as exactly that.

## Then it lied on the first real codebase

The failure didn't come from a fixture. It came from real code, on the most basic axis, in a case the fixtures hadn't covered. The Cognito profile documented how token storage works in Amplify v6, where you override it by calling `setKeyValueStorage`:

```ts
// What the profile knew to look for (Amplify v6):
cognitoUserPoolsTokenProvider.setKeyValueStorage(storage);
```

The codebase was Amplify v5, where you don't call that function. Storage is a field in the config object, a completely different shape:

```ts
// What the codebase actually did (Amplify v5):
Amplify.configure({
  Auth: { cookieStorage: { domain: ".example.com", secure: true, expires: 7 } }
});
```

The model searched for the v6 pattern, found nothing, and concluded "default storage, localStorage." The cookie configuration was right there in the file, in a shape the profile had never been told about. One missed pattern, one confidently wrong "no finding," and it was the exact failure the tool exists to prevent, happening inside the tool.

When I fixed it, I checked Amplify's source rather than trusting memory: the default is localStorage in both versions. So the tool wasn't wrong about the default. It was wrong because it never noticed this codebase had overridden the default through a shape it didn't recognize. "The default is localStorage" and "this codebase uses localStorage" are completely different claims, and the distinction is subtle but the most valuable thing the tool can get right.

That points at the real lesson: the tool didn't lie because it was careless, it lied because the task is hard. Storage alone has two completely different shapes across two versions of one vendor; multiply that across four axes, several providers, and the open-ended variety of real codebases, and you get a huge space where "I found nothing" can mean "truly absent" or "here in a form I wasn't taught." That space is where confident fabrication lives, and the harness has to scale with it. You can't close the gap by asking the model nicely.

## Designing for honesty instead of asking for it

A line in the prompt saying "be accurate, don't fabricate" does almost nothing; a model under pressure to produce a useful-looking report will produce one. The work was making fabrication structurally hard.

A small example sets the pattern. I started with "all findings should be verifiable," a wish. It became operational: every finding must carry a link to the exact file and line of evidence, one the reader can click. To produce that link the model has to have found the line, so verifiability stopped being a request and became something the output has to contain.

The same principle drives the rule that keeps the mechanical pass honest. A text match is a candidate, never a finding:

> 1. Locate: use the profile's identifiers to find candidate locations.
> 2. Confirm: open each candidate and read the surrounding code. A vendor type inside the adapter is correct; the same type in app-layer code is a leak.

The textbook case is a wrapper that looks like a boundary and isn't. The search finds it, and a shallow pass calls it owned; only reading the return type shows the vendor's shape passing straight through to every caller:

```ts
// Looks like a boundary. Isn't.
export async function getSession(): Promise<AuthSession> {
  return fetchAuthSession(); // returns Amplify's session type, unchanged
}
```

The rules also live in the shape of the output. The report template makes the load-bearing sections mandatory: a Coverage section stating what was and wasn't analyzed, so "no finding" can't read as "clean"; per-finding evidence so every claim is checkable; and a "Judgment calls for you" section collecting the questions the audit refused to answer. A model can still misbehave, but it has to do so against the structure, which also hands the reader a way to catch it: if the Coverage section admits it skipped a file you know is full of auth logic, that gap is itself a signal you can act on.


![Coverage section stating what was and wasn't analyzed](/blog/designing-honest-ai-tools/coverage-section.png)

## The interview: from evidence to meaning

In its first form the tool stopped at the evidence: finding X, finding Y, each with a file and line. Accurate, and not useful, because the reader still has to turn "you read claims inline in fourteen places" into "and for us, that means something." Having the model make that leap is where it starts inventing, because meaning depends on what it can't see: your roadmap, your org, the contracts that depend on the current choice.

So I put an interview between the evidence and the meaning. The tool presents what it found, grouped by axis, then asks the questions only the maintainer can answer, one at a time, with an explicit "don't know" that routes that axis into "Judgment calls" rather than forcing an answer. These were the guiding questions, adaptable to different contexts:

> - Token storage: "Is a storage change on the table, like a move to HttpOnly cookies?"
> - Refresh: "Is a change to refresh coming, often downstream of a storage move?"
> - Identity provider: "Is a provider swap realistically possible in the next year or two? Roughly how many call sites would it touch?"
> - Authorization: "Is an authorization-model change planned (RBAC, ID to access token)? What backend contracts depend on the current choice?"

Their answers supply likelihood, the mechanical pass supplies the cost evidence, and only together do they produce a ranking, with every rank traceable to which input was the human's. With no human in the loop, the tool refuses to rank and stops at the findings and open questions. The refusal is a feature.

Building the interview into the skill changed how it analyzes, not just how it reports. Because the run is oriented toward an interview from the start, the mechanical pass is already asking "what here is a judgment call I will have to escalate, and what is the most useful question to ask about it?" instead of "what answer can I produce?" A model planning to ask is a model less inclined to invent; the interview is an output stage and an anti-fabrication mechanism at once.

The broader lesson holds past auth: between a finding and its meaning is a set of things only the human knows, and designing the tool to ask for them sharpens its own detection too.

## Distilling without diluting

Running it on real codebases surfaced a quieter failure: the reports were thorough and far too long to use. A valuable finding would sit in paragraph nine, indistinguishable from six routine ones. A finding nobody reads might as well be one the tool never made.

So I added a one-screen summary, distilled from the full report rather than written separately. That ordering matters more than it looks. Because the full report already carries the harness (the coverage section, the per-finding file links, the refusal to score what only the human knows), the summary inherits that reliability and doesn't have to re-earn it. So the summary can play by lighter rules: focus on finding and presenting the most relevant aspects of the report, instead of validating and double-checking.

With the right structure, you can get both the actionable clarity of a concise summary and the proven reliability of a full report behind it.

```markdown
## Auth Calcification Summary: <repo>

Vendor: Amazon Cognito (Amplify v5). Boundary: a leaky facade, not a real seam.

Most important: RBAC is on your roadmap, but the API is authorized with the ID token
while permissions arrive in the access token. The plan has an unnamed dependency.

| Axis          | Today                 | If you change it                          |
| ------------- | --------------------- | ----------------------------------------- |
| Token storage | v5 cookieStorage      | Low, once the facade becomes a real seam  |
| Refresh       | Inherited from vendor | Medium; no single-flight, no failure path |
| Provider      | Cognito-specific      | High; groups/claims read in 14 call sites |
| Authorization | ID token, inline      | High; blocks the RBAC move above          |

Full evidence and file links are in the report.
```

## Where it is now

The skill is live, open source, and installable as a Claude Code plugin. The repository is [here](https://github.com/dragosbln/auth-calcification).

Add the repo as a plugin marketplace, install from it, then point Claude at a project:

```bash
# in Claude Code (exact names are in the repo README)
/plugin marketplace add dragosbln/auth-calcification
/plugin install auth-calcification-audit@auth-calcification
```

From there, ask it to audit your auth layer. It runs the mechanical pass, asks you the short interview, and writes three things: the full report, the one-screen summary, and an actionable backlog ordered by priority using your answers.

Right now it ships with Cognito and Auth0, but the ports-and-adapters design means you can extend it. Clone the repo, hand `references/vendor-profile-schema.md` and your provider's docs to Claude Code (or your AI IDE) to draft a new profile, drop it in `vendors/`, and run the skill from your fork. No core changes; that's the whole point of the split. If you do, I'd welcome the findings, the misses, and the suggestions.

## Key takeaways

- The harder and broader the task, the more the harness matters. Confident fabrication concentrates where the work is complex and the inputs vary.
- Prompting for honesty isn't enough. A clickable file-and-line link, a mandatory coverage section, and a refusal to rank without human input are structure, not requests.
- Don't fabricate judgment; escalate it. Detect mechanically, then hand back what only the maintainer can answer.
- Tools over-produce, so distillation is part of the product. A correct finding buried on page three fails like a wrong one.
- An interview built into the tool disciplines the model as much as it informs the human.
- The boundary discipline you would apply to auth applies to the tool itself: keep the vendor-specific parts swappable.

## Conclusion

Every one of these fixes came from the same root: a tool that has to reason about a wide, nuanced space will, sooner or later, hit a corner it wasn't taught and answer anyway, with total confidence. You don't fix that by asking it to be honest; you fix it with a harness that makes the honest output the easy one to produce, and the harness has to scale with the task, because that complexity is exactly where fabrication breeds.

In the agentic era, the typing gets outsourced and the judgment doesn't. The mechanical work that used to make teams skip the boundary is nearly free now; what's left, and what's worth your attention, is the judgment about what any of it means. A good tool automates that detection, escalates the judgment, and presents the findings with clarity — baked into its structure, not asked for.

---

_If your team is about to make an expensive-to-reverse decision in auth, cloud, or platform architecture and wants an independent second pair of eyes, that's the kind of work I take on through Luckylabs. DMs open._
