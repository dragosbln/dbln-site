"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { resolveHashHref } from "@/lib/hashHref";
import { isModifiedClick } from "@/lib/isModifiedClick";

type HashLinkProps = {
  href: string;
  className?: string;
  /** Replaces the link's text as its accessible name (a context entry that leads to booking). */
  "aria-label"?: string;
  /** Runs before HashLink's own handling (see the composition note below). */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
};

/**
 * `Link` for hrefs that may point at a section (`/#contact`).
 *
 * On the page the href targets, this renders it relative (`#contact`) and
 * handles the click itself: it pushes the hash onto the history and scrolls
 * the section into view. Everywhere else the full href is kept, `Link`
 * navigates and the new page lands on the section.
 *
 * Why not leave same-page clicks to the router: Next scrolls on a click only
 * when it sees a hash-only change against its own idea of the current URL,
 * and that idea drifts from the address bar. `/#contact` on `/?fbclid=…`
 * differs in query, so the router runs a soft navigation to the same page,
 * finds no changed segment and never scrolls (the relative href fixes that
 * one). After a native fragment jump (the skip link, a hand-edited URL) the
 * router still holds the previous hash, so a click back to that hash is a
 * same-URL navigation for it and nothing moves. Pushing the hash through
 * `history.pushState`, which Next patches to carry its router state and to
 * resync the URL, keeps Back/Forward consistent (a plain `<a href="#…">`
 * would make an entry without that state, and Back from a later client-side
 * navigation then shows the wrong page under the right URL) and leaves the
 * scroll to us. A click while the URL already carries the hash only scrolls,
 * so it adds no duplicate history entry.
 *
 * Modified clicks (new tab, new window) stay with the browser, and a target
 * that is not in the document falls through to `Link`.
 *
 * A caller's `onClick` runs first; if it calls `preventDefault()`, the click
 * is the caller's and HashLink does nothing more (no scroll here, and `Link`
 * skips the router on a prevented click too).
 */
export default function HashLink({
  href,
  className,
  "aria-label": ariaLabel,
  onClick,
  children,
}: HashLinkProps) {
  const pathname = usePathname();
  const { href: resolved, id } = resolveHashHref(href, pathname);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || id === null || isModifiedClick(event)) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, "", `#${id}`);
    }
    target.scrollIntoView();
  };
  return (
    <Link
      className={className}
      href={resolved}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
