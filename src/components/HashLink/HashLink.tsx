"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { resolveHashHref } from "@/lib/hashHref";
import { isModifiedClick } from "@/lib/isModifiedClick";

type HashLinkProps = {
  href: string;
  className?: string;
  /** Runs before HashLink's own handling (see the composition note below). */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
};

/**
 * `Link` for hrefs that may point at a section (`/#contact`).
 *
 * Next's router treats a click as a hash jump only when the target's query
 * string equals the current one (`onlyHashChange` in
 * segment-cache/navigation.js). `/#contact` has no query, so on `/?fbclid=…`
 * or any `utm_*` landing URL the router runs a soft navigation to the same
 * page, finds no changed segment and never scrolls: the button looks dead.
 * On the page the href targets, this renders it relative (`#contact`); the
 * browser resolves that against the current URL, query included, so the
 * router sees a hash-only change and scrolls. Everywhere else the full href
 * is kept and the navigation lands on the section as before.
 *
 * Not a plain `<a href="#…">`: a native fragment jump makes a history entry
 * without the router's state, and Back from a later client-side navigation
 * then shows the wrong page under the right URL.
 *
 * A click while the URL already carries the hash is a same-URL navigation
 * for the router, which doesn't scroll either, so that case scrolls the
 * target itself and skips the router.
 *
 * A caller's `onClick` runs first; if it calls `preventDefault()`, the click
 * is the caller's and HashLink does nothing more (no scroll here, and `Link`
 * skips the router on a prevented click too).
 */
export default function HashLink({
  href,
  className,
  onClick,
  children,
}: HashLinkProps) {
  const pathname = usePathname();
  const { href: resolved, id } = resolveHashHref(href, pathname);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || id === null) return;
    if (isModifiedClick(event) || window.location.hash !== `#${id}`) return;
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView();
  };
  return (
    <Link className={className} href={resolved} onClick={handleClick}>
      {children}
    </Link>
  );
}
