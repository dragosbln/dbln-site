"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { resolveHashHref } from "@/lib/hashHref";

type HashLinkProps = {
  href: string;
  className?: string;
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
 */
export default function HashLink({ href, className, children }: HashLinkProps) {
  const pathname = usePathname();
  const { href: resolved, id } = resolveHashHref(href, pathname);
  const onClick =
    id === null
      ? undefined
      : (event: MouseEvent<HTMLAnchorElement>) => {
          if (isModifiedClick(event) || window.location.hash !== `#${id}`) {
            return;
          }
          event.preventDefault();
          document.getElementById(id)?.scrollIntoView();
        };
  return (
    <Link className={className} href={resolved} onClick={onClick}>
      {children}
    </Link>
  );
}

/** Same rule as Next's Link: new-tab/window clicks stay with the browser. */
function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}
