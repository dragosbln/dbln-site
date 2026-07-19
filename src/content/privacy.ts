import { site } from "./site";
import type { PrivacyNotice } from "./types";

/**
 * /privacy page copy. This is a description of the code's actual behaviour,
 * so it is only true as long as that behaviour holds. The claims that carry
 * weight: no cookies, Plausible is cookieless and EU-hosted, and Cal.com is
 * contacted only after a format pick (see AGENTS.md, "Contact booking" and
 * "Analytics"). Identity values interpolate from site.ts so they can't drift.
 */
export const privacy: PrivacyNotice = {
  hero: {
    eyebrow: "Privacy",
    title: "What this site collects, *and what it doesn't.*",
    lede: "No cookies. No tracking across sites. Two third parties, and one of them only wakes up when you ask for it.",
    metaDescription:
      "What dbln.me collects and what it doesn't. Cookieless analytics, no cross-site tracking, and a booking flow that contacts Cal.com only when you choose to.",
  },
  updated: "2026-07-19",
  updatedLabel: "Last updated",
  sections: [
    {
      num: "01",
      title: "Who is responsible",
      body: [
        `This site is published by **${site.company}**, based in ${site.location}. I am ${site.name}. I decide what happens with the data described on this page, and there is very little of it.`,
      ],
    },
    {
      num: "02",
      title: "No cookies",
      body: [
        "This site sets no cookies. Nothing is stored on your device to track you, and there is no consent banner because there is nothing to consent to.",
        "A few things are held in your browser, each tied to something you did. When you pick a call format in the contact section, that choice stays in session storage so the page can show it back to you after you book. The stored copy never leaves your browser and is gone when you close the tab. The choice itself goes to Cal.com with your booking.",
        "When you like an article, your browser keeps a random id and the list of articles you liked. The list keeps the button lit on your next visit. The id travels with your likes so one browser counts once. Neither says who you are. Clear your browsing data and both are gone.",
      ],
    },
    {
      num: "03",
      title: "Analytics",
      body: [
        "Traffic stats come from Plausible Analytics, hosted in the EU. It is cookieless and it counts in aggregate: pages viewed, referrers, countries, browsers, how far down an article people read, and which articles get liked.",
        "Your IP address is used to work out a country and to derive a rotating one-way hash that tells one visit from another. Plausible discards it. It is never stored, and no profile of you exists at either end.",
        "The legal basis is legitimate interest. I need to know which articles are worth writing and where readers come from. Any content blocker stops it.",
      ],
    },
    {
      num: "04",
      title: "Liking an article",
      body: [
        "Likes go to this site's own backend, hosted in the EU. The like itself is stored by this site alone, and the count you see is the count that is stored. A like is also counted as an event by the analytics above.",
        "Every time you like or unlike an article, a small record is kept: the article, the action, the time, and your browser's random id. The records keep the counts honest and let me clean up abuse. No name, no email address and no IP address is stored with them.",
        "The legal basis is legitimate interest. If you want your likes removed, email me and they go.",
      ],
    },
    {
      num: "05",
      title: "Booking a call",
      body: [
        "The contact section embeds Cal.com. Nothing is requested from Cal.com until you pick a call format. Scroll past the section and no third party is contacted at all.",
        "Once you pick a format, Cal.com loads and the booking form is theirs. Your name, your email, the format you picked and your answer about what you are weighing go to Cal.com so the call can be scheduled, and they reach my calendar. Cal.com's own privacy policy covers their side of it.",
        "The legal basis is taking steps at your request before a contract.",
      ],
    },
    {
      num: "06",
      title: "Email",
      body: [
        "If you email me, I keep the message so I can reply and pick the thread up later. It stays in my mailbox. You are not added to a list. There is no list.",
      ],
    },
    {
      num: "07",
      title: "Your rights",
      body: [
        "You can ask what I hold about you, ask for a copy, ask for it to be corrected or deleted, and object to any of it. The analytics are aggregate, so nothing in them points to you and I cannot pull your visit out of them.",
        "Ask me first. If that goes nowhere, you can complain to ANSPDCP, the Romanian data protection authority.",
      ],
    },
  ],
  contact: {
    num: "08",
    title: "Questions",
    body: ["Anything on this page, ask. A plain answer comes back."],
    emailHint: "Questions about this notice, or a request about your data.",
  },
};
