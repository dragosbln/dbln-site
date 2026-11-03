import type { Metadata } from "next";
import Hero from "@/components/Hero";
import JsonLd from "@/components/JsonLd";
import Review from "@/components/Review";
import Testimonials from "@/components/Testimonials";
import Work from "@/components/Work";
import Writing from "@/components/Writing";
import Booking from "@/components/pages/home/Booking";
import { homeServiceSchema } from "@/lib/schema";

// Title, description, og and robots (index, follow) come from the root
// layout: the home page is the site's default page.
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
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
      <Booking />
      <JsonLd data={homeServiceSchema} />
    </main>
  );
}
