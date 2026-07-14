"use client";

import CheckIcon from "@/components/CheckIcon";
import LinkIcon from "@/components/LinkIcon";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";

/** The copy-deep-link button portaled into a single article heading. */
export default function HeadingLink({ id }: { id: string }) {
  const { copied, copy } = useCopyToClipboard();

  const onClick = () => {
    // strip a preview-only ".html" so copied links are always clean
    const base = location.origin + location.pathname.replace(/\.html$/, "");
    copy(`${base}#${id}`);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <button
        type="button"
        className="heading-anchor"
        data-copied={copied || undefined}
        onClick={onClick}
        aria-label={copied ? "Link copied" : "Copy link to this section"}
      >
        {copied ? <CheckIcon size={13} /> : <LinkIcon size={13} />}
      </button>
      {/* Permanently mounted so the status region exists before its content
          changes — live regions injected pre-filled are unreliably announced. */}
      <span
        className={copied ? "heading-anchor-tip show" : "heading-anchor-tip"}
        role="status"
      >
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}
