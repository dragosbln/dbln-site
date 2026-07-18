import { site } from "@/content/site";
import type { Post } from "@/content/types";
import { coverOgImage, postUrl } from "@/lib/urls";

/**
 * schema.org JSON-LD objects, rendered by <JsonLd /> in the root layout.
 * Structured data is the primary machine-readable surface for search
 * engines and AI crawlers. Identity values are referenced from
 * src/content/site.ts, never restated, so they cannot drift.
 */

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${site.url}/#person`,
  name: site.name,
  jobTitle: site.role,
  description: site.description,
  url: site.url,
  email: `mailto:${site.email}`,
  worksFor: {
    "@type": "Organization",
    name: site.company,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: site.locality,
    addressCountry: site.countryCode,
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

// Home is spelled `site.url` (no trailing slash) everywhere: canonical,
// og:url, sitemap and breadcrumbs must agree on one form.
export const workBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: site.url },
    { "@type": "ListItem", position: 2, name: "Work", item: `${site.url}/work` },
  ],
};

export const blogBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: site.url },
    { "@type": "ListItem", position: 2, name: "Writing", item: `${site.url}/blog` },
  ],
};

export const privacyBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: site.url },
    {
      "@type": "ListItem",
      position: 2,
      name: "Privacy Notice",
      item: `${site.url}/privacy`,
    },
  ],
};

export function postBreadcrumbSchema(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: "Writing", item: `${site.url}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl(post.slug),
      },
    ],
  };
}

export function techArticleSchema(post: Post) {
  return {
    "@context": "https://schema.org",
    // BlogPosting keeps Google Article rich-result eligibility (TechArticle
    // alone is outside its supported set); TechArticle keeps the precision.
    "@type": ["TechArticle", "BlogPosting"],
    headline: post.title,
    description: post.excerpt,
    url: postUrl(post.slug),
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(post.slug) },
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    keywords: post.tags.join(", "),
    image: `${site.url}${coverOgImage(post.cover)}`,
    inLanguage: "en",
    author: { "@id": `${site.url}/#person` },
    publisher: { "@id": `${site.url}/#person` },
    isPartOf: { "@id": `${site.url}/#website` },
    ...(post.devto ? { sameAs: [post.devto] } : {}),
  };
}

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
