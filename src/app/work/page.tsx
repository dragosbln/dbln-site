import type { Metadata } from "next";
import CaseArticle from "@/components/CaseArticle";
import CaseNav from "@/components/CaseNav";
import Contact from "@/components/Contact";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import { site } from "@/content/site";
import { caseStudies, workCta, workHero } from "@/content/work";
import { workBreadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Work",
  description: workHero.metaDescription,
  alternates: {
    canonical: "/work",
  },
  // Set per page: openGraph merges shallowly with the layout, which would
  // otherwise leave this page sharing the homepage's og:url and og:title.
  openGraph: {
    type: "website",
    url: "/work",
    siteName: site.name,
    locale: "en_US",
    title: "Work",
    description: workHero.metaDescription,
  },
};

export default function WorkPage() {
  return (
    <main id="main">
      <PageHero content={workHero} />
      <CaseNav
        items={caseStudies.map((c) => ({
          id: c.id,
          // "Equinet — by Mustad" → "Equinet" for the chip label
          label: c.name.split(/ — | · /)[0],
        }))}
      />
      <div className="wrap">
        {caseStudies.map((caseStudy, index) => (
          <CaseArticle key={caseStudy.id} caseStudy={caseStudy} index={index} />
        ))}
      </div>
      <Contact content={workCta} />
      <JsonLd data={workBreadcrumbSchema} />
    </main>
  );
}
