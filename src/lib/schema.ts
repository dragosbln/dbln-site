import { site } from "@/content/site";

/**
 * schema.org JSON-LD objects, rendered by <JsonLd /> in the root layout.
 * Structured data is the primary machine-readable surface for search
 * engines and AI crawlers; keep it in sync with src/content/site.ts.
 */

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${site.url}/#person`,
  name: site.name,
  jobTitle: "Independent Software Architect & Fractional CTO",
  description: site.description,
  url: site.url,
  email: `mailto:${site.email}`,
  worksFor: {
    "@type": "Organization",
    name: site.company,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cluj-Napoca",
    addressCountry: "RO",
  },
  sameAs: Object.values(site.socials),
  knowsAbout: [
    "Software architecture",
    "Authentication and security",
    "Event-driven systems",
    "Microservices",
    "Legacy modernization",
    "AWS",
    "Google Cloud Platform",
    "TypeScript",
    "Node.js",
    "Next.js",
    "PostgreSQL",
    "Agentic AI development",
  ],
};

export const workBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Work", item: `${site.url}/work` },
  ],
};

export const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: "en",
  publisher: { "@id": `${site.url}/#person` },
};
