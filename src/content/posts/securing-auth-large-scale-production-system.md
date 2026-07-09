---
title: "Securing auth in a large-scale production system: three industry-standard architectures — and why none survived a closer look"
date: "2026-05-14"
tags: ["architecture", "aws", "nextjs", "auth"]
excerpt: "Evaluating the auth layer for a Partner Portal of 100+ microservices. Three textbook architectures each looked right on the whiteboard and fell apart on contact with the constraints — here's the one that survived."
cover: "/blog/covers/securing-auth-large-scale-production-system.svg"
coverAlt: "A mesh of service nodes with a highlighted auth boundary"
devto: "https://dev.to/dragosbln/securing-auth-in-a-large-scale-production-system-three-industry-standard-architectures-and-why-279b"
---

*A case study in why the verdict on an architecture decision can shift entirely once you dive into implementation details — using auth security on a large Next.js + AWS system as the vehicle. This article walks the three architectural paths we considered — plus a fourth option that, in this context, won.*

## Context: a sensitive problem in a large scale system

The system: a large multi-frontend production stack. Multiple Next.js apps spread across subdomains, 100+ backend microservices, AWS Cognito for identity, API Gateway in front of the backend, downstream APIs expecting `Authorization: Bearer <id_token>` on every request.

The finding: a penetration test flags that our Cognito tokens — ID, access, refresh — are stored in non-HttpOnly cookies. Client-side JavaScript can read them. Any successful XSS exfiltrates them. Any leaked refresh token gives an attacker effectively indefinite access.

Here's what that looks like in flow form — the current client-side API call pattern, with the moment of vulnerability highlighted:

![fig. every call carries the token in the clear from the browser; the one JS-readable read is the whole exposure.](/blog/securing-auth-large-scale-production-system/current-implementation.svg)

Three things worth noticing before we go further. First, this flow is cheap — the client calls the backend directly, no proxy layer in the path, every component doing the minimum it has to. Second, the entire vulnerability is concentrated in the single step where browser-side code reads the token out of document.cookie to attach it to the outbound request. Third, every alternative we'll walk through changes the shape of that single moment — and in doing so, ripples through every other component on the diagram.

The shape of the fix is well-known: tokens should not be JS-readable. Move them off the client.

So why are we writing a 3,500-word article about it?

Because auth in a system like this isn't a feature. It's a hot path — twice. It's the entry point to the system, and then it's a participant in every API call that follows. The architecture choice you make doesn't just impact "the login screen." It impacts every request, every page render, every cost line item, every incident postmortem for the foreseeable future.

That's the kind of problem where the obvious architectural answer is the dangerous one — not because it's wrong, but because it's incomplete. The shape is right; the implementation cost can take you over the edge.

This article walks four architectural paths to fix the same vulnerability in the same system. Each path is sound in isolation. Each path's verdict shifts — sometimes inverts — once you stop thinking at the architecture level and start thinking at the implementation level.

The stack details are the vehicle. The cargo is the thinking pattern: **architectural thinking alone won't tell you which of these four paths is right. Implementation depth will.**

---

## The "obvious" answer, and why to distrust it

The chain of obvious reasoning:

1. Tokens accessible to JavaScript are vulnerable to XSS exfiltration.
2. Therefore, move tokens out of JavaScript's reach.
3. Therefore, use HttpOnly cookies, set by the server, never read by the client.
4. Done.

At the *shape* level, this is correct.

The trouble is that step 4. "Done" is not done — it's actually doing about 90% of the work in that argument. "Done" implies the implementation falls out cleanly. It almost never does.

The architectural move is to refuse "done" as an output until you've answered:

- How does the client-side code now authenticate API calls it used to authenticate directly?
- How does the backend now extract a credential it used to receive in a known format?
- How does the system refresh tokens that can no longer be seen by the code that previously refreshed them?
- What's the new attack surface? (HttpOnly cookies close XSS; they open CSRF.)
- What does the cost model look like at production scale?

Each of those questions has multiple architecturally-valid answers. Each answer creates a different system. The point of the analysis isn't to find *an* answer — it's to walk each answer to its third-order consequences before picking.

Let's do that.

---

## The constraint stack

The constraints below are real — pulled from the actual system. They're what every architectural option gets weighed against. The discipline here is *map options against constraints, not against feature checklists.*

**1. Frontend framework.** Next.js App Router, heavy use of Server Components, hybrid client-server data fetching.

**2. Downstream contract.** ~100+ backend microservices, all expecting `Authorization: Bearer <id_token>`. The API Gateway in front of them validates JWTs via its built-in authorizer reading the `Authorization` header. Changing this contract means changing it across all 100+ services in a coordinated manner. Doing it in fewer than all of them is not an option — the contract is uniform on purpose.

**3. Hosting cost model.** The Next.js apps run on Vercel. Vercel bills serverless functions by the *wall clock time* of every request — including the time spent waiting on a slow downstream call. A 5-second hung backend response gets billed for 5 seconds of compute, every time it happens.

**4. Client/server call ratio.** Roughly 65-70% of API calls in the system are made directly from the browser (client components, after-hydration data fetches). The remaining 30-35% happen server-side during SSR. Any architecture that proxies "all client calls through the server" effectively doubles the proxied request volume.

**5. Token characteristics.** Cognito JWTs are large — ID tokens commonly run 1-2KB, sometimes more depending on groups and claims. Browser cookie size limits sit at 4KB per cookie, and total request header limits (the source of HTTP 431 errors) sit at 8KB on many gateways. Putting multiple Cognito tokens in cookies and sending them on every request is a known production failure mode.

**6. Vendor library maturity.** AWS Amplify v6 supports HttpOnly cookies for Next.js — but only via an experimental server-side auth feature, and only when paired with Cognito Managed Login.

That's the stack. Every option below has to survive it.

---

## Path 1: Next.js BFF proxy

The pattern most commonly recommended in the Next.js ecosystem, and the one AWS Premium Support proposed in the first round of their guidance. It's also the default shape that libraries like Auth.js (formerly NextAuth) push you toward when wrapping OAuth providers — manage session cookies on the server, proxy token-bearing calls through Next.js route handlers.

**The shape:** All client-side API calls stop going directly to the backend. Instead, they hit Next.js route handlers (or Server Actions). Those handlers read tokens from HttpOnly cookies — which they can, because they're server-side — and forward the request to the backend with the `Authorization: Bearer` header attached.

![fig. Path 1 puts the Next.js BFF in the path of every call — the fix, and the whole cost and lock-in surface.](/blog/securing-auth-large-scale-production-system/path-1-bff-proxy.svg)

**The architectural appeal.** Clean. Well-documented. Vendor-blessed. The pattern most public material recommends. Tokens never touch the client; the downstream contract doesn't change; the API Gateway's existing JWT authorizer keeps working.

At the architecture level, this looks like the right answer. It is, in fact, the right answer for many systems.

**Where it stops looking right — implementation level.** Two things surface as you zoom in:

*The cost model breaks.* Recall constraints #3 and #4. We have a hosting model that bills for wall-clock wait time, and we'd be putting 65-70% of API traffic that previously bypassed Vercel directly *through* Vercel. Every slow backend call now costs us twice — once for the original execution time, once for the time the Vercel function spends waiting. A backend incident where calls take 30 seconds to time out becomes a Vercel bill incident.

*Vercel lock-in becomes structural.* In the BFF model, 100% of API traffic flows through Next.js route handlers on Vercel — making Vercel part of every API call's critical path, and shaping the architecture around Vercel-optimized patterns. Any future migration to a different host (for cost reasons, feature reasons, or just optionality) stops being a packaging change and becomes a real re-architecture. Vercel's billing model has, at this scale, already produced unwelcome surprises; locking the auth hot path to a single hosting vendor compounds that exposure rather than reducing it.

**Verdict shift.** Strong default. Wrong for *this* stack — the cost surface and the vendor lock-in are the real disqualifiers; everything else is downstream of them.

---

## Path 2: Token-broker BFF with session DB

A variant that escapes Vercel by introducing a dedicated AWS-native proxy. The browser holds an HttpOnly session cookie (opaque); a Lambda sits in front of the backend, reads the cookie, looks the session up in a database, retrieves the Cognito token, and forwards the request with the Bearer header attached.

This is essentially the architecture that **Better Auth** promotes when it's wired up to an external OAuth provider like Cognito: a server-side session store with the provider's tokens held inside it, and the browser carrying only an opaque session reference. Better Auth also supports a stateless variant — where the session is encrypted directly into the cookie and the DB lookup disappears — which trades the database hot path for cookie-size and key-rotation problems. We'll focus on the DB-backed shape, as it's the one most production deployments converge on.

![Path 2 — Token Broker with Session DB](/blog/securing-auth-large-scale-production-system/path-2-token-broker.png)

**The architectural appeal.** Full session control — you can revoke individual sessions, track devices, enforce idle timeouts, support multiple identity providers without each one polluting the cookie payload. Vercel cost goes away. The downstream contract is preserved.

**Where it stops looking right — implementation level.**

*We now own the entire auth substrate.* The biggest hidden cost in this path isn't in any individual diagram; it's in the operational total. A new database layer to provision, scale, and back up. A new session mechanism to write, test, patch, and version. A new piece of critical infrastructure to bring into the on-call rotation. Security updates and resilience improvements that previously came "for free" from the vendor stack — Amplify patches, Cognito-side improvements — now have to be applied (or replicated) by us. Auth is the part of a system you most want operated by people who specialize in operating auth; this path moves you in the opposite direction.

*The session DB becomes a hot path.* Every API call now pays a DB lookup latency. Even at with high-throughput DBs (like Dynamo) that's added to every request that crosses the system boundary, and the database becomes the system's availability ceiling for any authenticated traffic.

*Database choice is a one-way door.* DynamoDB is the AWS-native default, but if you ever need a relational session model — joins, audit trails, complex revocation rules — you're either retrofitting an inappropriate store or migrating. ElastiCache buys sub-millisecond reads but adds VPC complexity. Aurora + RDS Proxy buys SQL but needs explicit guard-rails against connection storms. Each is sticky once chosen.

*Observability fragments.* There's now an extra hop, possibly in a different language, in a different deployment unit. Distributed tracing has to follow it. Failures in the broker look different from failures in the backend — and that distinction matters during the worst incident calls, when you need to localize a problem in under five minutes.

**This is where it's worth distinguishing stateful complexity from feature complexity.** Both Path 1 and Path 2 add complexity, but in different shapes. Path 1's complexity is *operational* — a new layer that needs to scale and stay up. Path 2's complexity is *stateful and ownership-shaped* — a new system-of-record whose failure modes are harder to reason about, whose data has independent lifecycle from your application, and whose operation you now own end-to-end. Stateful complexity tends to be more expensive in the long run because state attracts more state, and ownership tends to be more expensive than people estimate at decision time.

**Verdict shift.** Justified only if you actually need the session-control features that come with it (multi-IdP, fine-grained revocation, device tracking as a product feature). Otherwise, you've taken on durable architectural debt — and a permanent operational burden — to solve a hosting-cost problem.

---

## Path 3: API Gateway Lambda authorizer reading cookies

The cleanest path *if you control the gateway*. Skip the BFF entirely. Configure the API Gateway with a custom Lambda authorizer that reads the auth credential from a cookie instead of the `Authorization` header. Browsers send the cookie automatically on requests with `credentials: 'include'`; the authorizer extracts and validates it; downstream services receive a Bearer token injected by the gateway.

**The shape:** HttpOnly cookie carries the Cognito JWT directly. The Lambda authorizer reads the cookie, validates the JWT against Cognito's JWKS endpoint (a library like [`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify) handles the signature and claims validation cleanly), and tells the gateway to inject the token into the `Authorization` header for the downstream call.

![Path 3 — API Gateway Lambda Authorizer](/blog/securing-auth-large-scale-production-system/path-3-gateway-authorizer.png)

On the architecture level, this is the most elegant of the four paths. No BFF. No session DB. No Vercel cost increase. Tokens never reach JS. Downstream services keep their existing JWT-from-header contract because the gateway re-injects it. Lambda authorizer responses are cached by API Gateway (default 300s), so the validation cost amortizes.

**Where it stops looking right — implementation level.**

*Cookie size limits.* Constraint #5 was waiting for this option. A full Cognito ID token plus an access token plus a refresh token can easily exceed the 4KB per-cookie browser limit. And on every request the browser sends, those cookies sit inside the total header size budget — most API Gateways cap around 8KB. Hit the cap, and the gateway returns HTTP 431 *before any of your code runs*. This isn't a hypothetical; it's a documented production failure mode for Cognito users who try this naïvely.

*Refresh token handling migrates into the auth infrastructure.* This is the surface most underestimated at decision time. In the JS-readable token world, the auth library handles refresh transparently from the client: the client asks for a session, the library checks expiry, refreshes if needed, returns the token. The client never sees the mechanics. In this model, the client can't see expiration at all — and the authorizer's job is structurally "allow or deny," not "issue new credentials."

So who refreshes? Three sub-options, each with cost:

- *The authorizer itself,* on every expired-token detection — but it then needs to write new cookies onto the response, which is awkward in an authorizer's lifecycle, and concurrent requests can stampede the refresh endpoint.
- *A dedicated refresh route handler* the client calls when it gets a 401 — this is the cleanest of the three, and the future state we ended up optimizing toward. It has well-defined seams, it's easy to test, and the client-side 401-then-refresh-then-retry pattern is a standard piece of HTTP plumbing when implemented carefully (with refresh deduplication so concurrent 401s don't trigger N parallel refreshes).
- *Pre-emptive refresh from middleware* — but middleware doesn't have a natural seam to mutate cookies on outbound responses in a way Next.js, the browser, and the gateway all agree on.

None of these are blockers. All of them are real work. And refresh is the part of auth where bugs become production incidents fastest, because they manifest as intermittent 401s that are hard to reproduce.

*CSRF surface opens.* When the credential travels in an `Authorization` header set by your code, CSRF is structurally impossible — the attacker's page can't make the browser attach a custom header. When the credential travels in a cookie automatically attached by the browser, CSRF re-enters the threat model. You now need `SameSite=Lax` (or `Strict`), explicit anti-CSRF tokens for state-changing operations, or both.

**The non-technical reason this path didn't win — for us, this round.** Even with the refresh-route-handler model as the cleanest variant, we didn't pick Path 3, and the reason wasn't technical. The Lambda authorizer sat in another team's ownership, and that team had an active RBAC initiative consuming most of their bandwidth. Kicking off the cookie-authorizer rewrite at that moment would have meant either derailing their roadmap or eating cross-team coordination overhead that would have stalled both efforts. The right time for Path 3 was *after* the RBAC work landed — which gave us a natural future state to optimize toward, rather than a path to force through now.

**Worth naming: architecture is org-shaped.** The "right" technical path is sometimes blocked not by technology but by ownership and timing — another team owns the relevant component, that team has competing priorities, kicking off a cross-team effort would derail their roadmap. That's not a failure mode; it's a constraint. Name it explicitly in the analysis, and shape today's decisions around the future state where the timing flips — rather than pretending the org-state is somebody else's problem.

**Verdict shift.** Cleanest of the active fix paths if downstream services and gateway are yours to modify *and* the timing is right with the team that owns them. Costly enough in implementation work — particularly the refresh flow — that it should be entered into with eyes open, not signed up for at the elegant-diagram stage.

---

## Path 4: Conscious deferral + foundation work

The "boring" option. Presented last because it only earns its place after the first three have lost some shine.

Keep the current non-HttpOnly cookie storage. Mitigate the XSS surface via the usual hardening (strict CSP, short-lived access tokens, careful XSS posture in dependencies). Document the risk acceptance explicitly. Define what triggers the eventual migration. *Do the foundation work now* that makes the eventual migration cheap when the trigger fires.


![Path 4 — Conscious Deferral with Foundation Work](/blog/securing-auth-large-scale-production-system/path-4-deferral.png)

This is not "do nothing." It's a substantial decision with substantial work attached.

**What the foundation work actually looked like:**

- Migrated from an older Amplify version that used self-hosted login pages — which structurally could not support HttpOnly cookies — to Amplify v6 with `ssr: true` and Cognito Managed Login. That's the version whose experimental HttpOnly feature *exists*. Moving to it converts the eventual migration from a six-month re-architecture into a config flag.
- Re-pointed the application's login UX from self-hosted pages to Cognito Managed Login, which is a prerequisite for Amplify's HttpOnly mode and also de-risks the future migration (no custom login UI to retrofit).
- Wrote an explicit risk acceptance — not a passing mention in a Slack thread, but a stakeholder-signed document describing the vulnerability we were knowingly keeping live, the mitigations in place, and the triggers that flip the decision.
- Defined the migration trigger. The primary trigger was the sunset of legacy frontend systems that were structurally incompatible with the new auth flow. Until those were gone, migrating the new system wouldn't actually have eliminated the vulnerability at the org level. A secondary trigger was a parallel RBAC initiative that would create a natural alignment point for backend/infra teams to revisit authentication anyway.
- Captured the full decision and option analysis — including the work that went into Paths 1-3 — so the next architect picking this up doesn't redo months of research.

**The architectural appeal.** No disruption to a 100+ service system. Full understanding captured. The eventual fix is now *cheap*, not *prohibitive*. The decision is reviewable, with clear conditions under which it should be revisited.

**This is the work that separates "ship the broken pattern" from "defer the fix with intent."** When the right answer is "don't change the externally-visible behavior yet," the work that earns that answer is invisible from the outside — but it's the work that determines whether the eventual change is a flag flip or a re-architecture.

**Verdict.** In *this* constraint stack, with these specific triggers visible in the roadmap, the right answer. Anchored explicitly: in a different stack (no Vercel, smaller backend, fewer downstream services, no upcoming roadmap alignment point), the verdict could land on any of Paths 1-3.

---

## The decision matrix

Compressing everything above into a comparison:

| | Frontend impact | Backend impact | Cost surface | New attack surface | Reversibility |
|---|---|---|---|---|---|
| **Path 1 — Next.js BFF** | High (all client API calls re-routed through Next.js) | None | Vercel compute doubles on proxied traffic | CSRF if cookies auto-attached | Medium |
| **Path 2 — Broker + session DB** | Medium | Low (gateway untouched) | DB hot path; new infra cost | CSRF + new failure mode | Low (DB choice is sticky) |
| **Path 3 — Gateway authorizer w/ cookies** | Medium (refresh flow re-architecture) | Medium (new Lambda authorizer + gateway config) | Modest (Lambda invocations, amortized by cache) | CSRF + cookie size risk + new refresh failure modes | High |
| **Path 4 — Defer + foundation** | Low (substrate upgrade) | None | None | Unchanged (deferred) | High |

The matrix shifts if specific constraints flip:

- *Not on Vercel?* Path 1's cost surface mostly disappears. It becomes a strong default again.
- *Don't control the API Gateway?* Path 3 evaporates.
- *Need session revocation as a product feature?* Path 2 moves from over-engineered to required.
- *No legacy frontend dependency?* Path 4 loses its trigger and you go pick a real fix.

This kind of sensitivity is the point. The verdict isn't intrinsic to the path; it's intrinsic to the path *plus* the constraint stack.

---

## Where architectural thinking ends and architectural judgment begins

The meta-point of this article, explicitly:

Architectural thinking, by itself, can absolutely tell you that Cognito tokens shouldn't be readable in JS. It can tell you that the broad shapes of the fix involve some combination of server-held state, BFF proxying, or gateway-level credential extraction. It can sketch you a clean diagram for each path and identify their structural trade-offs.

Architectural thinking *alone* cannot tell you:

- That Vercel's billing model makes Path 1 expensive in a way that doesn't show up on the diagram.
- That Cognito tokens are too big to fit inside cookies the way Path 3 wants them to.
- That moving from one auth library version to another *is itself* the substrate work that makes the eventual fix cheap.
- That vendor support (AWS Premium Support in our case) can give you two contrary answers if you ask twice — and that both can be correct under different assumptions.
- That your stakeholders can accept "we're deferring the fix" if you give them an artifact, instead of just giving them a meeting.

These details don't live in the architecture diagrams. They live in implementation specifics, vendor docs, billing models, threat models, organizational state, and roadmap context. The job is to *go get them* — read the vendor docs to the bottom, run the cost numbers, sketch the migration in enough detail that the unknowns become visible — and feed them back into the architectural choice.

That's the thing worth leaving you with. **Architecture is a discipline you do all the way down to implementation depth, or it's not architecture — it's a slide deck.**

Acceptance of an existing flawed pattern can be a legitimate architectural outcome. So can adopting an experimental vendor feature, or building a new infrastructure component, or kicking the decision to the team that owns the gateway. What separates a good outcome from a bad one is whether the choice was made *with* full visibility into its second- and third-order consequences, or *without*.

---

## Takeaways

Surfaced throughout the article, collected here for reference:

- **Map options against constraints, not features.** A pattern's quality is a function of context; the same pattern can be right or wrong in different stacks.
- **Distinguish stateful complexity from feature complexity.** Both are complexity; they fail differently and accumulate differently.
- **Use foundation moves.** Modernize substrate now to make future fixes cheap. The work is invisible from outside but determines the cost of the eventual decision.
- **ADR-as-artifact.** When you defer a decision, the deliverable is the documented decision and risk acceptance — not the absence of the change.
- **Architecture is org-shaped.** The "right" technical path is sometimes blocked by ownership and timing rather than technology. Name it explicitly in the analysis; design today's decision around the moment the timing flips.
- **Vendor support is an input, not a conclusion.** Useful, often correct, never the last word. Ask twice; you'll get different answers when you clarify constraints.
- **When deferring, write the trigger.** A deferral without a defined trigger is procrastination. With one, it's a roadmap entry.
- **Walk implementation details for every option.** Without it, architecture is artificial in the best case, severely misleading in the worst.

---

## Closing

I wrote a companion piece on LinkedIn about the narrative side of this — what it felt like inside the team to spend weeks researching a security fix and then deliberately ship the pattern the pentest had flagged. [Link soon to come]

The technical depth here is the substantiation. The thinking pattern — implementation-aware architecture — is the actual point.

If your team is about to make an expensive-to-reverse architecture decision and wants an independent second pair of eyes, that's exactly the kind of work I run as part of architecture and cloud advisory engagements through Luckylabs. The analysis above is roughly the format of a typical engagement, applied to one specific problem. If it sounds useful, the fastest way to reach out is dragos@dbln.me
