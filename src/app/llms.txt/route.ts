import { site } from "@/content/site";
import { getPosts } from "@/lib/posts";

// Emitted as a static /llms.txt at build time (https://llmstxt.org) — a
// curated, markdown summary of the site for LLM agents. Extend the Pages
// list as routes are added.
export const dynamic = "force-static";

export function GET() {
  const articles = getPosts()
    .map(
      (post) =>
        `- [${post.title}](${site.url}/blog/${post.slug}): ${post.excerpt}`,
    )
    .join("\n");

  const body = `# ${site.name}

> ${site.role}. ${site.description}

- Based in ${site.location}; works remotely across EU and US time zones.
- Engagement formats: architecture advisory, fractional CTO / tech lead, hands-on senior engineering.
- Engagements run through ${site.company}.
- Contact: ${site.email}

## Pages

- [Home](${site.url}/): positioning, selected work, engagement formats, testimonials, writing
- [Work](${site.url}/work): six case studies in depth (situation, the expensive-to-reverse decision, approach, outcomes) — Pie Insurance, Bullseye Web3 Studio, Parentool, Glede, Reach Finance, Equinet
- [Writing](${site.url}/blog): all articles; RSS at ${site.url}/feed.xml

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
