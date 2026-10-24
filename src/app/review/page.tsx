import type { Metadata } from "next";
import Contact from "@/components/Contact";
import JsonLd from "@/components/JsonLd";
import Deliverables from "@/components/pages/review/Deliverables";
import FirstRead from "@/components/pages/review/FirstRead";
import Landing from "@/components/pages/review/Landing";
import Questions from "@/components/pages/review/Questions";
import Rail from "@/components/pages/review/Rail";
import Reviewer from "@/components/pages/review/Reviewer";
import Situations from "@/components/pages/review/Situations";
import { landing, questions, reviewPath } from "@/content/review";
import { site } from "@/content/site";
import {
  faqPageSchema,
  reviewBreadcrumbSchema,
  reviewServiceSchema,
} from "@/lib/schema";
import { siteOgImage } from "@/lib/urls";

export const metadata: Metadata = {
  title: landing.title,
  description: landing.metaDescription,
  alternates: {
    canonical: reviewPath,
  },
  // Set per page: openGraph merges shallowly with the layout, which would
  // otherwise leave this page sharing the homepage's og:url and og:title.
  openGraph: {
    type: "website",
    url: reviewPath,
    siteName: site.name,
    locale: "en_US",
    images: [siteOgImage],
    title: landing.title,
    description: landing.metaDescription,
  },
};

/**
 * The offer page: the landing, then six numbered sections, then the same
 * booking band as the home page. Section order and ids: src/content/review.ts.
 */
export default function ReviewPage() {
  return (
    <main id="main">
      <Landing />
      <Situations />
      <Rail />
      <Deliverables />
      <Reviewer />
      <FirstRead />
      <Questions />
      <Contact />
      <JsonLd data={reviewBreadcrumbSchema(landing)} />
      <JsonLd data={reviewServiceSchema(landing)} />
      <JsonLd data={faqPageSchema(questions.items)} />
    </main>
  );
}
