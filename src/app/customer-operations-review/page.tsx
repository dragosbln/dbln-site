import type { Metadata } from "next";
import BookingBand from "@/components/BookingBand";
import JsonLd from "@/components/JsonLd";
import Deliverables from "@/components/pages/customer-operations/Deliverables";
import Hero from "@/components/pages/customer-operations/Hero";
import Process from "@/components/pages/customer-operations/Process";
import Questions from "@/components/pages/customer-operations/Questions";
import Story from "@/components/pages/customer-operations/Story";
import Who from "@/components/pages/customer-operations/Who";
import {
  bookingBand,
  customerOperationsPath,
  hero,
  questions,
} from "@/content/customerOperations";
import { site } from "@/content/site";
import {
  faqPageSchema,
  offerBreadcrumbSchema,
  offerServiceSchema,
} from "@/lib/schema";
import { siteOgImage } from "@/lib/urls";

export const metadata: Metadata = {
  title: hero.pageTitle,
  description: hero.metaDescription,
  alternates: {
    canonical: customerOperationsPath,
  },
  // Set per page: openGraph merges shallowly with the layout, which would
  // otherwise leave this page sharing the homepage's og:url and og:title.
  openGraph: {
    type: "website",
    url: customerOperationsPath,
    siteName: site.name,
    locale: "en_US",
    images: [siteOgImage],
    title: hero.pageTitle,
    description: hero.metaDescription,
  },
};

/** This page's Cal.com namespace (see `BookingBand`). */
const CAL_NAMESPACE = "customer-operations-review";

/**
 * The customer-operations review page: the hero, five numbered sections and
 * the booking band. Section order and ids: src/content/customerOperations.ts.
 */
export default function CustomerOperationsReviewPage() {
  return (
    <main id="main">
      <Hero />
      <Story />
      <Process />
      <Deliverables />
      <Who />
      <Questions />
      <BookingBand content={bookingBand} namespace={CAL_NAMESPACE} />
      <JsonLd
        data={offerBreadcrumbSchema(customerOperationsPath, hero.pageTitle)}
      />
      <JsonLd
        data={offerServiceSchema(
          customerOperationsPath,
          hero.pageTitle,
          hero.metaDescription,
        )}
      />
      <JsonLd data={faqPageSchema(questions.items)} />
    </main>
  );
}
