/**
 * Single source of truth for site-wide content and identity.
 * Section content (work, engagements, testimonials, …) is added here
 * as the landing page is built.
 */

export const site = {
  url: "https://dbln.me",
  name: "Dragos Bilaniuc",
  company: "Luckylabs Software SRL",
  role: "Independent Software Architect & Fractional CTO",
  title: "Dragos Bilaniuc — Independent Software Architect & Fractional CTO",
  description:
    "I help teams get the expensive-to-reverse decisions right, then build them. Eight years of architecture and platform work across insurance, Web3 and health-tech: auth, data, system boundaries.",
  email: "hello@dbln.me",
  location: "Cluj-Napoca, Romania",
  socials: {
    devto: "https://dev.to/dragosbln",
    github: "https://github.com/dragosbln",
    linkedin: "https://www.linkedin.com/in/dragosbln",
    x: "https://twitter.com/dragosbln",
  },
} as const;

export type Site = typeof site;
