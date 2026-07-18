import { engagements, site } from "@/content/site";
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

  // Derived from content so a new engagement format or case study can't
  // leave this file — the primary AI-crawler surface — stale.
  const formats = engagements.items.map((i) => i.title).join(", ");
  // short case names ("Equinet — by Mustad" → "Equinet"), matching CaseNav
  const caseNames = caseStudies.map((c) => c.name.split(/ — | · /)[0]).join(", ");

  const body = `# ${site.name}

> ${site.role}. ${site.description}

- Based in ${site.location}; works remotely across EU and US time zones.
- Engagement formats: ${formats}.
- Engagements run through ${site.company}.
- Contact: ${site.email}

## Pages

- [Home](${site.url}/): positioning, selected work, engagement formats, testimonials, writing
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
