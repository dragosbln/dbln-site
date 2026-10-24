<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

- **Static export.** `next.config.ts` sets `output: "export"`. Nothing may rely on a server at runtime: no dynamic route handlers, no `cookies()`/`headers()`, no middleware. Route handlers must be `force-static` GET.
- **Components.** One folder per component: `src/components/<Name>/` containing `<Name>.tsx`, `<Name>.module.css` (if styled), and an `index.ts` barrel (`export { default } from "./<Name>";`). Import other components via `@/components/<Name>`; import a component's own CSS relatively (`./<Name>.module.css`). Top level is for shared pieces (primitives, chrome, anything two pages use); a section that belongs to one page lives in `src/components/pages/<page>/<Name>/` with the same folder shape (first used by `/review`). The `pages/` level is load-bearing: `src/components/review/` would be the same directory as the `Review` component on the case-insensitive macOS disk (git records whichever casing existed first), and the import then fails on the Linux CI runner. A section's client leaf is a second file in the section's folder, imported relatively. Top-level components never import from a page folder.
- **Styling.** CSS Modules only — no inline `style={{}}`, no styled-jsx, no Tailwind. `src/app/globals.css` holds only design tokens, the reset, and the `.wrap` / `.section` / `.reveal` utilities. Everything else lives in the owning component's module. Two exceptions, both global because the markup is generated from markdown at build and can't carry hashed module classes: `src/styles/prose.css` (`.prose`, plus the `.prose--peek` compact variant) and `src/styles/diagram.css` (`dg-*`).
- **Content.** All copy, links, and identity data live in `src/content/site.ts`. Components render content; they don't contain it.
- **Server-first.** Components are React Server Components by default. Add `"use client"` only at interactive leaves (e.g. scroll reveal), never on whole sections.
- **SEO surfaces.** When adding a route, update `src/app/sitemap.ts` and the Pages list in `src/app/llms.txt/route.ts`, and give the page its own `metadata` export with a canonical. Keep JSON-LD in `src/lib/schema.ts` in sync with content changes.
- **Social cards.** A page that exports its own `openGraph` replaces the layout's wholesale, so it must list `images: [siteOgImage]` (`src/lib/urls.ts`) or it ships no image. The card type is `summary_large_image` everywhere (layout; articles set it too): X builds no card at all for `summary` pages — verified in its composer on 2026-10-16, where the home page and /blog showed no preview while the articles did. Don't "simplify" the type back, and keep twitter images as plain URL strings (matching the article pages, which are known to render).
- **Copy voice.** Outward-facing copy is written by Dragos's rules: short declarative sentences, no em-dash asides, no "not X but Y" constructions, no overexplaining. Never invent or rewrite copy on your own — take it verbatim from `src/content/` or from the prototypes in `../claude_websie/`. Real testimonial quotes are verbatim, always.

# Recipes

## Article diagrams (animated figures)

Never draw article diagrams freehand — use the `article-diagram` skill
(`.claude/skills/article-diagram/`). It carries the dg-* grammar
(`src/styles/diagram.css` + `references/grammar.md`), six canonical exemplars,
a validator and a live workbench. Brief → static → motion → validate, with a
user checkpoint at each stage.

Follow these exactly — they encode decisions already made. The reference
implementation for all of them is the landing page.

## Reveal: never swap a Reveal's className on a live instance

`Reveal` adds its `.in` class **imperatively** (`el.classList.add`), but React
owns `className`. So if React reuses a `Reveal` instance and its `className`
prop differs, React rewrites the attribute and silently wipes `.in` — and the
mount effect that would re-add it never re-runs (empty deps). The element
stays at `opacity: 0`: present in the DOM, correct styles, invisible.

This bites when two branches of a conditional render `Reveal` at the same
position with different classNames (React reconciles by type + position, so
it updates rather than remounts). Give each branch a distinct `key` (see
`BookingFlow`'s resting/confirmed fragments) so React mounts a fresh subtree.
Symptom to recognize: one Reveal lacks `in` while its siblings — whose
className props didn't change — still have it.

## In-page links: render `/#section` hrefs with `HashLink`

Section hrefs in content stay `/#contact` (they must work from every page).
Render them with `HashLink` (Header, Hero), never a bare `Link` or `<a>`.
It relativizes the href to `#contact` on the page it targets and falls back
to `Link` elsewhere. Why: Next's router only performs a hash jump when the
target's query string equals the current one, so a `Link` to `/#contact`
on `/?fbclid=…` (Facebook, LinkedIn, any utm link) updates the URL and
never scrolls: the button looks dead. A native `<a href="#…">` is not the
fix either: its history entry carries no router state, so Back from a later
client-side navigation shows the wrong page under the right URL (CaseNav's
chips have this today). `HashLink` also handles the click while the URL
already has the hash, which the router treats as a same-URL navigation and
doesn't scroll.

## Adding a section to a page

1. Add the copy to `src/content/site.ts`, typed with a shape from
   `src/content/types.ts` (extend `types.ts` if needed). No copy in components.
2. Create `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`,
   `index.ts` barrel.
3. The component is a server component. It imports its own content directly
   from `@/content/site`. Markup pattern (see `Work/Work.tsx`):
   `<section id="…" className="section" aria-labelledby="<id>-title">` →
   `<div className="wrap">` → `<SectionHead num title id aside>` → content.
4. Wrap each animated block in `<Reveal>` (`as="li"` inside lists to keep
   semantics). Inline stat/em emphasis in content strings renders via
   `richText()` from `@/lib/richText`.
5. Compose the section in the page's `<main>`.

## Adding a page

1. Content: a new typed file in `src/content/`.
2. Route: `src/app/<route>/page.tsx` exporting `metadata` with `title`,
   `description`, and `alternates.canonical`. For per-slug pages use
   `generateStaticParams` (static export requires it).
3. The page renders `<main id="main">` (skip-link target). Header/Footer come
   from the root layout — never re-add them.
4. Register the route in `src/app/sitemap.ts` and in the Pages list of
   `src/app/llms.txt/route.ts`.
5. Structured data: add the matching schema.org object (e.g. `Article`,
   `BreadcrumbList`) in `src/lib/schema.ts`, rendered with `<JsonLd>` from
   that page.
6. References: `/work` (PageHero + CaseNav + CaseArticle + Contact-with-content,
   diagrams in the CaseDiagram registry) and `/blog` (posts pipeline below).

## Publishing an article

Articles are markdown files in `src/content/posts/<slug>.md` with frontmatter
(`title`, `date`, `tags`, `excerpt`, `cover`, `coverAlt`, optional
`syndication`).
Everything downstream is automatic — the pages, the landing Writing cards,
`sitemap.ts`, `llms.txt`, `/feed.xml`, and the raw-markdown twin at
`/blog/<slug>.md` (copied to `public/blog/` by `scripts/export-post-markdown.mjs`
via the predev/prebuild hooks). Read time is computed from word count.

To publish:
1. Drop the `.md` in `src/content/posts/`. Body is pure markdown, no h1 —
   the frontmatter `title` renders as the page h1; sections start at `##`.
   The filename is the slug: phrase it as the search query the article
   answers (`software-architecture-in-unpredictable-projects`), never as the
   title's wordplay (`sketching-out-the-extremes`). Keep slug, image folder
   and cover filename identical.
2. Put article images in `public/blog/<slug>/` and reference them with
   absolute paths (`/blog/<slug>/name.png`). Never hotlink external hosts.
3. Create a cover at `public/blog/covers/<slug>.svg` following the cover-art
   system in `../claude_websie/blog-social/style-deck/` (1200×630, paper grid,
   inset frame, corner ticks, mono FIG label, ONE teal element). Then generate
   its raster twin for `og:image` (SVG isn't rendered by link scrapers):
   `npm run build && node scripts/render-cover-png.mts <slug>` — commit the
   resulting `public/blog/covers/<slug>.png` alongside the SVG.
4. Cross-link other articles with site-relative URLs (`/blog/<slug>`), never
   dev.to URLs — this site is the canonical home; dev.to cross-posts set
   `canonical_url` back to here.
5. Code blocks are highlighted at build by shiki using the `dbln-dark` theme
   defined in `src/lib/markdown.ts` (colors inlined at build, no client-side
   highlighting ever); the `.prose pre` container is styled in
   `src/styles/prose.css`.
6. Code references: link to a GitHub **blob** URL and the link becomes a
   mono chip that opens the file in the repository pane (`CodePeek`; design
   in `../claude_websie/blog-social/code-peek.js` + `design_handoff_code_peek/`).
   `…/blob/<ref>/<path>` shows the whole file, `#L50-L53` a range, `#L12` one
   line. Link text is the writer's; the convention is the filename plus the
   range (`retry.ts#L50-L53`, `classify.ts`). Prefer a commit sha as `<ref>`
   so the cited lines never drift; the pane shows the short sha. The link
   still works as a plain link (and always on modifier/middle click).
7. Cross-posts (dev.to, a Medium publication…): once a copy is public AND
   its own canonical points back here, add its URL to the frontmatter list
   `syndication`. It feeds the article's JSON-LD `sameAs` and nothing else:
   copies are deliberately not linked on the page, so readers stay where the
   likes and comments live. Verify the copy's canonical first (a post still
   in a moderation queue, or behind a login, serves crawlers no canonical);
   Medium publications move the story to their own domain on acceptance, so
   list the publication URL. The old single `devto` field fails the build.

## Contact booking (Cal.com)

The contact section (design: 3a in `../claude_websie/directions/brief.html`)
is a server shell (`Contact`) slotting the heading into one client leaf
(`BookingFlow`): format picker + optional note on the left, a paper card with
the Cal.com inline embed (`@calcom/embed-react`) on the right.

The Cal side is configuration the code depends on — breaking it fails
silently:
- Event: `dragosbln/30min` (30 min, Google Meet via the connected Google
  Calendar).
- Booking field on that event: select `format`, **optional + hidden**, with
  option values exactly `live-misbehaving` / `live-unmeasured` / `pre-launch` /
  `other` (mapped in `site.ts` `booking.formats[].value`; the picker asks for
  the visitor's situation with their AI feature, not an engagement format). A required hidden field
  would deadlock the booking; the visitor answers on-site instead. The
  "What are you weighing?" question is a **visible** field inside Cal's own
  booking form, not asked on-site.

Interaction model (decided by Dragos, don't regress):
- **Click-to-load, and it is a privacy boundary — do not "optimize" it by
  preloading.** Nothing is requested from Cal until the visitor picks a
  format: no `embed.js`, no iframe, so scrolling past the section contacts
  no third party and stores nothing on the device. The pick is the visitor's
  explicit request for the booking service, which is what keeps this
  defensible under ePrivacy without a consent banner (the site's only
  analytics is Plausible — cookieless, nothing stored on the device, see
  "Analytics" below — and the site sets no first-party cookies; keep both
  true, or this calculus changes). The veil names Cal.com so the choice is
  informed.
- The booker renders veiled (blurred overlay + `inert`) until a format is
  picked; the veil pill asks for one. Picking the first format boots Cal and
  mounts the iframe with the prefill.
- The boot is latched to run **once** (`booted` ref): `cal("on", …)` adds
  window listeners that are never removed, so re-running on a later pick
  would double-register the booking handlers and fire them twice per event.
  Unpicking unmounts the iframe but leaves the boot latched, so re-picking
  is instant.
- Switching (or deselecting) the format after the visitor has clicked into
  the booker opens a native `<dialog>` confirming the restart — the remount
  throws away anything entered in Cal's form. A click inside the
  cross-origin iframe is detected as the parent window's `blur` with
  `document.activeElement` inside the embed wrapper.
- No "book directly on Cal.com" link-out; the email link is the fallback
  path.
- Reschedule/Cancel reset the whole flow back to its resting state (veiled
  picker, fresh embed, cleared storage) on click. Those flows happen in Cal's
  own tab and fire no embed events here, so a cancelled booking would
  otherwise leave a permanently false acknowledgement behind. Resetting
  unmounts the link mid-click, which is safe: per HTML, a disconnected `<a>`
  still navigates (the connectedness check in "cannot navigate" excludes
  `a` elements) — verified in-browser, don't "fix" it with a setTimeout.
- After a booking lands (design 5a): the left column swaps to the
  acknowledgement (`booking.confirmed` in `site.ts`, heading slotted from
  `Contact` like the resting one) and the card swaps to a **site-rendered
  scheduled card** — the iframe unmounts entirely. Cal's own success screen
  brings gutters, an inner scroll and a signup banner that cannot be styled
  from outside, so we render the details ourselves and keep Cal
  authoritative through links: `cal.com/reschedule/<uid>` and
  `cal.com/booking/<uid>?cancel=true` (both also live in the invite email).
- Confirmed-state data merges from both events, either order:
  `bookingSuccessfulV2` (documented) carries uid + start/end; the deprecated
  v1 `bookingSuccessful` carries the booking object. Real payloads are
  messier than the types: response values can be strings, `{value,label}`
  (selects) or `{firstName,lastName}` (name); notes may live in
  `responses.notes` OR `booking.description`; the attendee in
  `responses.name` OR `attendees[0].name`; times on the booking object OR
  derived from the event root's `date`+`duration`. `asString`/
  `extractBooking` in BookingFlow normalize all of these — extend them,
  don't bypass them. The Focus echo falls back through Cal's record →
  picker ref → `sessionStorage["dbln:booking-format"]` (written on every
  pick, so it survives client-side navigation between pages). Both handlers
  `console.debug("[dbln booking]", …)` the raw payload on purpose — a real
  booking is diagnosable from the visitor console when Cal's shape drifts
  again. Rows render only when their data arrived. State is per-session;
  reload resets. To test without a real booking, dispatch the namespaced
  CustomEvent (`CAL:booking:bookingSuccessfulV2` / `…:bookingSuccessful`)
  on `window` — that is exactly how embed-core delivers them. Pick a format
  first, or the handlers aren't registered yet and the events go nowhere.

Embed facts learned from the package source (do not "simplify" these away):
- The embed reads `config` once at iframe creation and ignores prop changes,
  so a format change remounts `<Cal>` via `key`.
- `cal("ui", …)` (cssVarsPerTheme, hideEventTypeDetails) is a one-shot
  postMessage, lost on remount — `BookingFlow` re-applies it on every
  `linkReady` event.
- Theming is **colors only** (`cssVarsPerTheme`); the booker's fonts are
  Cal's and will not match the site. The card header (event title, meta,
  format chip) is site-authored because `hideEventTypeDetails` removes
  Cal's own.
- A skeleton holds the card's min-height while the picked booker loads, so
  the card never collapses or shifts. (The old IntersectionObserver lazy
  mount was removed when click-to-load landed: a pick already implies the
  section is on screen, so the observer was dead weight.)

## The review offer page (/review)

Design: `../claude_websie/review-page-handover` (one `.dc.html` per section,
authoritative for markup, CSS values and copy; `README.md` there explains
the format). Content: `src/content/review.ts`, typed by the "review offer
page" section of `types.ts`; sections in `src/components/pages/review/<Name>/`;
the route composes them with the existing `Contact` and three JSON-LD
objects (breadcrumb, `Service`, `FAQPage`) built from the same content.

- **Anchors.** Section ids and every in-page href come from `anchors` and
  `reviewPath` in `review.ts` (`` `${reviewPath}#${anchors.contact}` ``),
  rendered with `HashLink`/`PillLink`, so a link and its target can't drift.
- **Everything is in the HTML.** Collapsed rows, the rail's inactive
  reading, the four unselected sample documents, the late questions: all
  rendered and toggled with the `hidden` attribute (`aria-expanded` /
  `aria-controls` on the control). The page is a crawler surface; never
  "optimise" that into conditional rendering.
- **Situation cards prefill the booking** through `BookingLink` →
  `src/lib/bookingPrefill.ts` → `BookingFlow`, never through the URL. The
  value is a visitor's click on this site, which is what lets `BookingFlow`
  treat it as the pick that loads Cal.com (the click-to-load boundary
  above). A request outlives a client-side navigation for 10 s so a card on
  another page can reach a freshly mounted booking section; a page that
  renders its own booking section takes every request, so its cards must
  target that section. Don't add a `?situation=` reader: a shared URL would
  load Cal without a click.
- **Sample documents** render through `DocumentPage` from the `DocBlock`
  vocabulary in `types.ts` (kicker, meta, p, quote, answer, table, ol, ul,
  kv, finding, code). Extend the vocabulary rather than adding markup to a
  section; the renderer is meant to outlive this page.
- **Shared primitives** that came with the page: `ChevronIcon`, `PillLink`
  (the ink pill for any href kind: mailto, external, internal), `BookingLink`,
  `DocumentPage`; `SectionHead` gained `asideTail` (an inline link inside
  the aside sentence), `asideOnPhone` and `className`; `HashLink` composes a
  caller's `onClick`. Reuse them before writing a new one.
- **Testimonials** reuse `testimonials.items` from `site.ts`; a
  `shortQuote` is a verbatim cut of `quote` for compact placements, never a
  paraphrase.
- **Open items marked in content:** `TODO(cv)` (the design links `/cv.pdf`,
  which doesn't exist) and `TODO(first-read)` (the guide sub-page
  `/review/first-read` is designed separately). Both links are off until
  the files exist; flip the content, nothing else.

## Analytics (Plausible)

Traffic stats come from Plausible Cloud (EU-hosted) via the official
`@plausible-analytics/tracker` npm package — no snippet, no cookies, nothing
stored on the visitor's device. That last part is load-bearing: it is why
the Cal.com calculus above survives analytics being present. Never replace
this with a tool that sets cookies or touches device storage without adding
a consent banner first.

- `src/lib/analytics.ts` owns the integration: `initAnalytics()` (called
  once by the `Analytics` client leaf in the root layout) and
  `track(name, props)`, a safe no-op wherever the tracker didn't boot. The
  package reads `location` at module scope, so it is dynamic-imported at
  runtime — a static import crashes the prerender in `next build`.
- Hostname gate: the tracker boots on the canonical host (+ `www`) and on
  localhost, where it only logs "Ignoring Event" instead of sending
  (`captureOnLocalhost` stays false). Firebase preview channels
  (`*.web.app`) never boot it: preview traffic can't pollute the stats, and
  previews contact no third party.
- Pageviews (SPA navigations included), scroll depth, engagement time and
  outbound link clicks are automatic. Custom events: `Booking Format
  Picked` and `Booking Confirmed` (both carry a `format` prop) in
  `BookingFlow`; the confirmed one is latched per booking because Cal fires
  both the v1 and v2 success events for a single booking.
- Dashboard side: each custom event (plus `Outbound Link: Click`) needs a
  goal created once in Plausible under Site settings → Goals, or it won't
  surface there.
- Exclude your own visits with `localStorage.plausible_ignore = "true"` —
  the tracker ships in the site's own bundle, so an adblocker won't filter
  it for you.

## Social backend (/api)

First-party likes (comments to follow) served by one Cloud Function — the
`functions/` workspace, gen2 `api` in europe-west1 — behind the Firebase
Hosting rewrite `/api/**` in firebase.json. Design source:
`../claude_websie/blog-social/article.html` (engage bar + discussion).

Invariants. These are privacy boundaries: breaking any of them makes
/privacy wrong (a compliance problem, see below).
- **Same-origin only.** The visitor's browser talks to dbln.me and nothing
  else. A new third-party request is a /privacy change, not a tweak.
- **No person-identifying data on likes.** The subject is `d_<uuid>` from
  localStorage (`dbln:device`, minted on the first like press — never on
  page view). No IP is ever persisted (rate limiting in
  `functions/src/ratelimit.ts` is memory-only by design), no UA, no names.
  Limits are three-tier: per subject, per client (keyed on the two
  RIGHTMOST X-Forwarded-For entries — the infra-appended ones; never
  trust the left of XFF or express `trust proxy: true` + `req.ip`, the
  caller controls those), and a global per-instance write ceiling that
  bounds what a determined caller can do before admin cleanup.
- **Records are append-only.** `likeEvents` is never updated or deleted by
  code. `meta/counters` is written in the same transaction as the state
  doc + event record, so displayed counts always equal what the records
  add up to. Never write counts outside that transaction.
- **Firestore has no client surface.** firestore.rules denies everything;
  only the function's Admin SDK reads or writes. Keep it that way.
- **Counts render only when ≥ 1** — a real zero shows nothing. Fake or
  seeded counts were explicitly rejected; never add them.

Comments (instant post, no review queue — Dragos's call): POST
/api/comments goes public immediately; the guardrails replace the queue.
- Server: honeypot field `website` (must arrive empty), HMAC
  proof-of-page-visit token from GET /api/comments (functions/src/token.ts:
  ripens after 5s, dies after 24h — stateless, any instance verifies. The
  5s delay stays by Dragos's call on 2026-10-16; what was broken was the
  button going dead with no feedback, fixed on the client — see Discussion
  below. The 2h life became 24h so a long-open tab doesn't fail its post),
  2s per-subject cooldown (double-submit guard only; it was 30s and mostly
  hit the author replying to several comments), per-subject/per-client/global
  comment windows,
  name ≤ 60 / body ≤ 1200 / ≤ 3 links (counted as "http(s)://"), control
  chars stripped (newlines kept). Bodies are stored as typed; at render,
  `[words](https://…)` and bare http(s) URLs become links
  (`src/lib/commentLinks.ts`, no HTML ever injected, nothing but absolute
  http(s) hrefs; outbound links open a new tab as `ugc nofollow`). Nested
  replies to depth 4 with the parent required to be visible
  on the same slug, 1000-comment thread cap. GET /api/comments is
  no-store (it carries the token and must read back instantly after a
  post); only the counts endpoint is CDN-cached.
- Removal is SOFT (`status: "removed"`, admin in phase 3): the doc stays,
  the visible counter decrements in the same transaction, and the reader
  view (shared `toPublicThread`) keeps a bare placeholder only while a
  visible descendant needs it for thread shape. Replying to a removed
  parent is refused.
- Every comment is emailed to Dragos via HIS OWN Gmail (nodemailer, app
  password) — deliberately no third-party mail service. Sends are
  fire-and-forget AFTER the response; mail failure never fails a post.
- Secrets (one-time, BEFORE the social-branch deploy — deploys fail while
  any is missing):
  `firebase functions:secrets:set SOCIAL_TOKEN_KEY` (openssl rand -hex 32),
  `firebase functions:secrets:set GMAIL_USER`,
  `firebase functions:secrets:set GMAIL_APP_PASSWORD`,
  `firebase functions:secrets:set ADMIN_UIDS` (comma-separated Firebase
  Auth uids; empty admits no one — fails closed. To authorize an admin:
  they sign in once at /admin (creating their Firebase Auth user), then
  read their uid from Firebase Console → Authentication → Users, add it to
  ADMIN_UIDS, and `npm run deploy:backend`. The /admin panel deliberately
  does NOT print the uid — a non-admin who signs in sees only a generic
  "not authorized").
  Secrets bind at deploy time (gen2), so changing one takes effect on the
  next `npm run deploy:backend`. No CI IAM to configure: the backend
  deploys from the owner's own logged-in machine, which already has the
  Secret Manager and gen2 permissions (see "Deploy split" below).

Admin panel (/admin + /api/admin): the owner's moderation tool.
- The page is deliberately undiscoverable: noindexed, disallowed in
  robots.ts, absent from sitemap/llms.txt/nav — the "Adding a page"
  recipe is skipped on purpose. Its static HTML is only a sign-in gate.
- Auth: Google popup via `src/lib/firebaseClient.ts` (Firebase web SDK,
  dynamic-imported behind the click — it must NEVER load on a public
  page view; that would add third-party requests /privacy denies).
  `authDomain` is dbln.me itself (Hosting auto-serves /__/auth/* on the
  custom domain). Console one-time (all three, or the popup fails):
  enable the Google provider; add dbln.me under Auth → Authorized domains;
  AND add `https://dbln.me/__/auth/handler` to the auto-created OAuth web
  client's Authorized redirect URIs (Google Cloud → Credentials) —
  connecting the custom domain does not add it, and its absence throws
  redirect_uri_mismatch.
- The API verifies the Firebase ID token per request against the
  ADMIN_UIDS secret (functions/src/admin.ts) — no sessions, no cookies,
  fails closed when the allowlist is empty. Routes: overview (counts +
  all comments incl. removed + recent like events), comments/remove,
  comments/restore, comments/purge (hard delete, the GDPR path; counters
  adjust transactionally in every case).
- Local dev: the harness's verifier accepts the fixed token "dev-admin";
  AdminPanel uses localStorage "dbln:admin-dev-token" on localhost only.

Signed-in commenting ("remember me", phase 4): optional identity on top
of anonymous comments.
- A visitor may sign in with Google or GitHub from the comment form
  (`signInVisitor` in `src/lib/firebaseClient.ts`). Sign-in is
  SESSION-SCOPED and click-to-load: Firebase must never load or restore a
  session on page view (it would contact Google — the same privacy
  boundary as Cal and /admin). The SDK is dynamic-imported behind the
  sign-in click; verify it stays out of every page's eager chunks (grep
  built `out/` for `identitytoolkit`). Session scoping is ENFORCED with
  `initializeAuth(app, { persistence: inMemoryPersistence })` — getAuth's
  default would persist a refresh token to indexedDB, which /privacy
  explicitly denies ("never keeps a password or a login token between
  visits"). Never switch to persistent auth without rewriting /privacy.
  This applies to /admin too: its session also ends when the page closes.
  What persists between visits is only `dbln:account` (uid + display
  name, NO token) so the form can offer one-click re-sign-in.
- Route ordering is a cost boundary: `verifyVisitor` verifies the ID
  token's signature and expiry (local once Google's certs are cached, but
  the first call per instance fetches them), so the cheap gates (shape
  checks, the HMAC page token) and the client+global limiters run BEFORE
  it in every route that takes an idToken. Don't reorder. It no longer
  passes `checkRevoked`: that was a network round-trip to Firebase Auth on
  every signed-in post, delete and claim, and sessions here are in-memory
  and die with the tab. The admin verifier keeps checkRevoked (purge is
  irreversible).
- Authed posts carry the Firebase ID token; the route derives the subject
  as `u_<uid>` from the VERIFIED token (never a client-supplied subject),
  so a caller can't attribute a comment to another account.
- Comment badges (three states): `author` (teal, trustworthy) > `verified`
  ("Signed in") > neither ("Guest"). `author` is computed at READ TIME
  from `subject ∈ ADMIN_UIDS` (`isAuthor` in app.ts, fed by the same
  `adminUids` list as the admin allowlist) — never client-set, so it can't
  be forged, and changing the list reflows past comments. It is in the
  public payload. Each sign-in provider is a separate Firebase account in
  this project (Dragos's Google and GitHub logins have different uids), so
  ADMIN_UIDS must list every uid he signs in with, or comments posted
  through the missing one show "Signed in" instead of "Author". The "Signed in" badge is deliberately NOT a checkmark
  and does NOT assert identity (the name is self-chosen even when signed
  in); only the UID-gated `author` badge is a real identity claim, which
  is what makes author-impersonation impossible. Don't relabel "Signed in"
  as "Verified".
- Anonymous posts still use `d_<uuid>`. Ownership for delete-own: authed
  via the token (`u_<uid>`), anonymous via the device id — safe because
  the public payload never exposes `subject`, so no other browser can
  know your `d_` id.
- On sign-in the client calls `/api/account/claim` to reassign THIS
  browser's `d_<uuid>` comments to `u_<uid>` (comments only — likeEvents
  stay immutable), so prior anonymous comments become the account's and
  stay deletable. `dbln:mine` (local ids) drives which delete buttons
  show; the server enforces ownership regardless.
- `verifyVisitor` in index.ts is plain `verifyIdToken(token)` (any
  signed-in user, no allowlist, no revocation check). Reuses the phase-2/3
  secrets — no new secret. Console: enable BOTH Google and GitHub
  providers (GitHub needs an OAuth app) with the same authorized-domain +
  redirect-URI setup as /admin.

Client side: `src/lib/social.ts` (the storage keys, enumerated in
/privacy, + fetch helpers; liked flags are an external store consumed via
useSyncExternalStore, with an in-memory overlay so hardened private modes
still toggle) and `EngageBar` (client leaf in ArticleView): lazy count
fetch on approach (IO + scroll fallback — IO delivers nothing in
throttled tabs; the GET only fills a count no POST response has set yet),
optimistic presses serialized through a promise chain. Count model:
displayed = last server count + net delta of unresolved presses; a failed
press removes only its own delta, and only the NEWEST press's response
may move the button. Don't "simplify" this back to setLikes(res.likes) —
that wipes queued presses' deltas and drifts the count when one fails.
Plausible event: `Like` (needs a one-time goal in the dashboard; /privacy
discloses that likes are counted by analytics — remove that line if the
event ever goes).
`Discussion` (client leaf in ArticleView) renders the thread: fetched on
mount with two retries (the token comes with it, and the request warms the
API instance — cold starts run 2–3s — before the reader scrolls down; the
old on-approach lazy fetch left the Post button dead for up to ~10s after
a jump to #discussion). The button stays disabled until the token has
ripened, but from the first typed character it shows a fill (`.arming`:
determinate, CSS-timed from the class landing, so apply it when the token
arrives, never when typing starts, or it lies about the time left;
`.waiting`: a sliding bar while no token has arrived, which also triggers
a fetch), so the wait reads as loading. After sign-in the thread refresh
keeps the token in hand (re-arming would restart the wait). A `token`
error on post refreshes the token, waits out the ripening and retries
once before showing an error. Hosting's `**` header rule
used to override the function's `no-store` on /api responses; firebase.json
now ends with an `/api/**` → `no-store` rule (later rules win). Thread
order: top-level newest-first / replies oldest-first, one reply
form open at a time, saved name in localStorage `dbln:name` filled
imperatively (never via state — hydration must match the empty input).
Cross-component count sync: posting calls `notifyCommentAdded(slug)`;
EngageBar subscribes and bumps its Comment count, and its Comment button
scrolls to #discussion and focuses #comment-body. /blog index rows fetch
the counts once on mount and show heart/bubble stats when ≥ 1.
Anonymous-post warning: `handleSubmit` (main form AND replies) intercepts
a submit when `getTokenRef.current` is null and opens a native `<dialog>`
warning that guest comments can't be managed; "Post as guest" sets a
session ref (`anonAcceptedRef`) so it only nags once, "Sign in" runs the
popup and auto-continues the post. `doSubmit` keys on the token getter
(not `account` state), so the auto-continue after in-dialog sign-in isn't
raced by React's state flush.

Slug allowlist: `functions/src/slugs.ts` is generated from
`src/content/posts/*.md` by `functions/scripts/gen-slugs.mjs` (prebuild
hook, output gitignored) and baked in at backend deploy. Articles published
after that deploy are learned at runtime from the live
`https://dbln.me/sitemap.xml` (`functions/src/slugCatalog.ts`), so a
hosting-only publish gets working likes and comments without a backend
deploy. Before this, a new article's Discussion was silently dead (GET
/api/comments → `unknown_slug`, no token, disabled Post button). Bounds:
known slugs never fetch, malformed slugs never fetch, misses fetch the
sitemap at most once per 30s per instance, and a failed fetch fails closed.
Slugs absent from the sitemap stay 400s. Keep the sitemap listing every
article at `https://dbln.me/blog/<slug>`, or new posts lose their
Discussion.

Local dev: the Firestore emulator needs Java, which the dev machine lacks.
Unit tests and the browser run against `MemoryStore` (same semantics as
`FirestoreStore`): `npm --prefix functions run serve` serves the built
site from out/ plus the real API app on :4610, with GET /__dump exposing
the stored records. Real Firestore semantics are exercised on deploy.

Deploy split (deliberate): CI (`deploy-live.yml`) deploys ONLY hosting on
every push to main, using the existing service-account secret it already
had. The backend (`functions` + `firestore:rules`) is deployed by the
owner from their own machine with **`npm run deploy:backend`** (runs the
functions tests, then `firebase deploy --only functions,firestore:rules`).
Rationale: gen2 functions deploy needs a broad, sensitive role set (Cloud
Run + Cloud Build + Artifact Registry + Secret Manager) that we do NOT
want on a CI-stored credential, gen2 CI deploys are flaky, and the backend
changes rarely; a logged-in owner has every permission already, so the
manual path needs no IAM setup. CI still builds + tests the functions
workspace as a merge gate — it just doesn't ship it.
One-time console prereqs: Blaze billing (confirmed) and the `(default)`
Firestore database in an EU location (it exists, in **eur3** — the EU
multi-region; a Firestore location is permanent and need NOT match the
function's region).
Bootstrap order: hosting deploys resolve the `/api/**` rewrite against the
project's EXISTING functions, so until `npm run deploy:backend` has run
once, any hosting deploy — PR previews included — ships a dead /api (404s;
the engage bar degrades to share-only). Run `npm run deploy:backend` once
after creating the DB and setting the secrets, then previews and live both
route /api correctly. Whenever the backend changes, run it again (CI won't).

## Privacy notice (/privacy)

`src/content/privacy.ts` → `PrivacyNotice` component → `/privacy`, linked
small under the copyright in the footer. The copy is **a description of what
the code does**, not boilerplate: it states that the site sets no cookies,
that the only device storage is the booking picker's `sessionStorage` key,
that Plausible is cookieless and EU-hosted, and that Cal.com is contacted
only after a format pick. Change any of those behaviours and this copy is
wrong — which is a compliance problem, not a stale-doc problem. Identity
values interpolate from `site.ts`; bump `privacy.updated` (drives both the
rendered date and the sitemap's `lastModified`) when the substance changes.

## Heading anchors (copy deep link)

Every article heading gets a hover "copy link" button — `HeadingAnchors`
(portals a `HeadingLink` into each `.prose h2/h3/h4[id]`; ids come from
rehypeSlug at build, so deep links work with no JS). Copies the clean URL
(strips a preview-only `.html`) and updates the address bar via
`history.replaceState` (no scroll). Shared primitives: `useCopyToClipboard`
hook + `LinkIcon`/`CheckIcon` — reused by the peek's "copy link to this
section" button. Styles are global in `prose.css` (injected into prose).

## Article cross-reference peeks

Internal prose links (`/blog/<slug>` ± `#fragment`) show a hover popover with
the referenced part of the target article — `src/components/ArticlePeek`.
Rules if you touch it:
- Progressive enhancement: the links stay real `<a href>`; **click always
  navigates**. Hover (400ms intent) or keyboard focus opens the peek; the
  pointer may cross into the panel (300ms grace). Not wired on touch
  (`hover: none`) — links just navigate.
- Content comes from fetching the target's own prerendered page and slicing it
  (anchored heading + its section, or the intro when there's no fragment).
  Never build a parallel excerpt store: the built HTML is the source of truth,
  so a peek can't drift from the article.
- The excerpt ends in an ellipsis when the article continues past it, and the
  panel's footer CTA ("Read the full article") opens the full piece in a new
  tab — one action, not duplicated in the header.
- Cloned fragments are sanitized: ids stripped (SVG ids suffixed via
  `src/lib/svgIds.ts`), `.dg-expand` removed, inner links forced to a new tab.

## Future chatbot ("Ask Dragos")

Static export means no API routes in this repo. The chatbot UI is a client
component (an interactive leaf — do not convert pages or sections to client
components for it) calling an external HTTPS endpoint (e.g. Cloud Run /
Cloud Functions). Prototype: `../claude_websie/assistant/assistant.js`.
