import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import PrivacyNotice from "@/components/PrivacyNotice";
import { privacy } from "@/content/privacy";
import { site } from "@/content/site";
import { privacyBreadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: privacy.hero.metaDescription,
  alternates: {
    canonical: "/privacy",
  },
  // Set per page: openGraph merges shallowly with the layout, which would
  // otherwise leave this page sharing the homepage's og:url and og:title.
  openGraph: {
    type: "website",
    url: "/privacy",
    siteName: site.name,
    locale: "en_US",
    title: "Privacy Notice",
    description: privacy.hero.metaDescription,
  },
};

export default function PrivacyPage() {
  return (
    <main id="main">
      <PageHero content={privacy.hero} />
      <PrivacyNotice />
      <JsonLd data={privacyBreadcrumbSchema} />
    </main>
  );
}
