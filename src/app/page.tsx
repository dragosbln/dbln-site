import type { Metadata } from "next";
import Agentic from "@/components/Agentic";
import Contact from "@/components/Contact";
import Engagements from "@/components/Engagements";
import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import Work from "@/components/Work";
import Writing from "@/components/Writing";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Work />
      <Engagements />
      <Testimonials />
      <Agentic />
      <Writing />
      <Contact />
    </main>
  );
}
