"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import HeadingLink from "./HeadingLink";

type Mount = { id: string; node: HTMLElement };

/**
 * Adds a hover "copy link" button to every article heading. Progressive
 * enhancement: rehypeSlug already gives headings ids (deep links work with no
 * JS); this only adds the copy affordance. Scoped to the article's own
 * `.prose` — the peek's `.prose` has its ids stripped, so it's skipped.
 */
export default function HeadingAnchors() {
  const [mounts, setMounts] = useState<Mount[]>([]);

  useEffect(() => {
    const created: Mount[] = [];
    document
      .querySelectorAll<HTMLElement>(
        ".prose h2[id], .prose h3[id], .prose h4[id]",
      )
      .forEach((heading) => {
        if (heading.querySelector(".heading-anchor-mount")) return;
        const node = document.createElement("span");
        node.className = "heading-anchor-mount";
        heading.appendChild(node);
        created.push({ id: heading.id, node });
      });
    // Portaling into DOM that only exists after render inherently needs this
    // measure-then-render step; the buttons are opacity:0 until hover, so
    // there's no flicker for the rule to guard against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounts(created);
    return () => {
      created.forEach((m) => m.node.remove());
    };
  }, []);

  return (
    <>
      {mounts.map((m) => createPortal(<HeadingLink id={m.id} />, m.node, m.id))}
    </>
  );
}
