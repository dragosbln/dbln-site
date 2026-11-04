import type { Metadata } from "next";
import BookingBand from "@/components/BookingBand";
import Hero from "@/components/Hero";
import JsonLd from "@/components/JsonLd";
import Review from "@/components/Review";
import Testimonials from "@/components/Testimonials";
import Work from "@/components/Work";
import Writing from "@/components/Writing";
import { homeBooking, site } from "@/content/site";
import { homeServiceSchema } from "@/lib/schema";
import { homeOgImage } from "@/lib/urls";

// Title, description and robots (index, follow) come from the root layout:
// the home page is the site's default page. The social card is this page's
// own (homeOgImage), so og and twitter are set here in full: each block
// replaces the layout's wholesale, and the layout keeps the site-wide card
// for pages without one.
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_US",
    images: [homeOgImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [homeOgImage.url],
  },
};

/**
 * The home page (design: the approved homepage of 2026-11-02): hero with the
 * profile aside, the engagement at a glance, selected work, testimonials,
 * writing, and the booking band with the click-to-load calendar.
 */
export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Review />
      <Work />
      <Testimonials />
      <Writing />
      <BookingBand content={homeBooking} namespace="home" />
      <JsonLd data={homeServiceSchema} />
    </main>
  );
}
