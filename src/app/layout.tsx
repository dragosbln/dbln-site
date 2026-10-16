import type { Metadata, Viewport } from "next";
import { Newsreader, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import { site } from "@/content/site";
import { siteOgImage } from "@/lib/urls";
import { personSchema, webSiteSchema } from "@/lib/schema";
import "./globals.css";
import "@/styles/diagram.css";
import "@/styles/prose.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-serif",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_US",
    // Site-wide og:image (link scrapers show a generic stock photo without
    // one). NOTE: pages that export their own `openGraph` (/blog, /work,
    // /privacy) replace this whole object and must list siteOgImage too.
    images: [siteOgImage],
  },
  // No title/description here: they would shadow every page's own
  // (twitter.* merges shallowly and X falls back to og:* anyway). Article
  // pages override with their cover PNG. The card type must be
  // summary_large_image: X builds no card at all for `summary` pages
  // (verified in its composer, 2026-10-16 — the home page and /blog showed
  // no preview while the articles did), and the image is a plain string so
  // the output matches the article pages exactly.
  twitter: {
    card: "summary_large_image",
    images: [siteOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f4ef",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        {/* React hoists this into <head> on every page — page-level
            `alternates` metadata would shallow-override a layout-level one. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${site.name} — Writing`}
          href="/feed.xml"
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
        <JsonLd data={personSchema} />
        <JsonLd data={webSiteSchema} />
        <Analytics />
      </body>
    </html>
  );
}
