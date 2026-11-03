import { landing, questions, reviewPath } from "@/content/review";
import { hero, review, site } from "@/content/site";
import { caseStudies } from "@/content/work";
import { getPosts } from "@/lib/posts";
import { postUrl } from "@/lib/urls";

// Emitted as a static /llms.txt at build time (https://llmstxt.org) — a
// curated, markdown summary of the site for LLM agents. Extend the Pages
// list as routes are added.
export const dynamic = "force-static";

export function GET() {
  const articles = getPosts()
    .map((post) => `- [${post.title}](${postUrl(post.slug)}): ${post.excerpt}`)
    .join("\n");

  // Derived from content so a change to the offer or a new case study can't
  // leave this file — the primary AI-crawler surface — stale.
  const { panel, context } = review;
  // rich-text markers off the hero title ("*handle next.*")
  const positioning = hero.title.replace(/\*/g, "");
  const lenses = panel.lenses.items.join(" and ");
  const deliverables = panel.receive.items.join(", ");
  const contexts = context.items
    .map((item) => `${item.name} (${item.desc.replace(/\.$/, "")})`)
    .join("; ");
  // short case names ("Equinet — by Mustad" → "Equinet"), matching CaseNav
  const caseNames = caseStudies.map((c) => c.name.split(/ — | · /)[0]).join(", ");

  const body = `# ${site.name}

> ${site.role}. ${site.description}

- ${positioning} ${hero.lede}
- Based in ${site.location}; works remotely across EU and US time zones.
- Offer: ${review.title} — ${panel.scope.toLowerCase()}, ${panel.duration.toLowerCase()}. ${panel.bring.label}: ${panel.bring.text} ${panel.lenses.label}: ${lenses}. ${panel.receive.label}: ${deliverables}.
- Review contexts: ${contexts}.
- Engagements run through ${site.company}.
- Contact: ${site.email}, or book a 30-minute call at ${site.url}/#contact

## Pages

- [Home](${site.url}/): positioning, the engagement at a glance, selected work, testimonials, writing, booking
- [${landing.title}](${site.url}${reviewPath}): the offer page in full: when you need it, how it runs stop by stop with a worked example, the five deliverables as sample pages, who runs it, the free first read, ${questions.items.length} questions answered
- [Work](${site.url}/work): ${caseStudies.length} case studies in depth (situation, the expensive-to-reverse decision, approach, outcomes) — ${caseNames}
- [Writing](${site.url}/blog): all articles; RSS at ${site.url}/feed.xml
- [Privacy Notice](${site.url}/privacy): what the site collects (no cookies, cookieless analytics, Cal.com only on request)

## Writing

Every article is also available as raw markdown: append ".md" to its URL.

${articles}

## Profiles

- [GitHub](${site.socials.github})
- [LinkedIn](${site.socials.linkedin})
- [dev.to](${site.socials.devto})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
