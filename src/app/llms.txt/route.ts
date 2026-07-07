import { site } from "@/content/site";

// Emitted as a static /llms.txt at build time (https://llmstxt.org) — a
// curated, markdown summary of the site for LLM agents. Extend the Pages
// list as routes are added (work, blog).
export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.role}. ${site.description}

- Based in ${site.location}; works remotely across EU and US time zones.
- Engagement formats: architecture advisory, fractional CTO / tech lead, hands-on senior engineering.
- Engagements run through ${site.company}.
- Contact: ${site.email}

## Pages

- [Home](${site.url}/): positioning, selected work, engagement formats, testimonials, writing

## Profiles

- [GitHub](${site.socials.github})
- [LinkedIn](${site.socials.linkedin})
- [dev.to](${site.socials.devto})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
