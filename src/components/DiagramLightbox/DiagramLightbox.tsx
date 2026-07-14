"use client";

import { useEffect, useRef, useState } from "react";
import CloseIcon from "@/components/CloseIcon";
import { suffixSvgIds } from "@/lib/svgIds";
import styles from "./DiagramLightbox.module.css";

/**
 * Expand-to-lightbox for inlined article diagrams (.dg-figure, emitted by
 * src/lib/rehypeInlineSvg.ts). Progressive enhancement: the figures' expand
 * buttons ship hidden; this component un-hides and wires them on mount.
 *
 * The modal shows a clone of the figure's SVG at large size. For wide
 * (landscape) diagrams on a portrait phone, the clone renders rotated 90°
 * so the diagram uses the screen's long axis — turn the phone to view it.
 */
export default function DiagramLightbox() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);

  // Runs from every close path directly (× button, backdrop click, Esc)
  // instead of relying on the dialog "close" event: it doesn't bubble,
  // React's onClose doesn't reliably deliver it, and some environments
  // defer its dispatch. Idempotent, so double-firing is harmless.
  const handleCleanup = () => {
    document.body.style.overflow = "";
    bodyRef.current?.replaceChildren();
  };

  useEffect(() => {
    const wired: { btn: HTMLButtonElement; open: () => void }[] = [];

    const dialog = dialogRef.current;
    const onClose = () => handleCleanup();
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCleanup();
    };
    // the close listener stays as a safety net for close paths we don't own
    dialog?.addEventListener("close", onClose);
    dialog?.addEventListener("keydown", onEscape);

    // .dg-figure is only ever emitted by rehypeInlineSvg inside article prose
    document
      .querySelectorAll<HTMLElement>(".dg-figure")
      .forEach((figure, index) => {
        const btn = figure.querySelector<HTMLButtonElement>(".dg-expand");
        const svg = figure.querySelector("svg");
        if (!btn || !svg) return;

        const open = () => {
          const dialog = dialogRef.current;
          const body = bodyRef.current;
          if (!dialog || !body) return;
          setWide(figure.classList.contains("dg-wide"));
          body.replaceChildren(cloneForModal(svg, `-x${index}`));
          document.body.style.overflow = "hidden";
          dialog.showModal();
        };

        btn.hidden = false;
        btn.addEventListener("click", open);
        wired.push({ btn, open });
      });

    return () => {
      // Unmounting while open (e.g. browser Back during client navigation)
      // removes the <dialog> but not the body scroll lock — release it here.
      handleCleanup();
      dialog?.close();
      dialog?.removeEventListener("close", onClose);
      dialog?.removeEventListener("keydown", onEscape);
      wired.forEach(({ btn, open }) => {
        btn.removeEventListener("click", open);
        btn.hidden = true;
      });
    };
  }, []);

  const close = () => {
    handleCleanup();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-label="Expanded diagram"
      onClick={(e) => {
        // backdrop click: the dialog element itself is the target only
        // when the click lands outside its children
        if (e.target === dialogRef.current) close();
      }}
    >
      <button
        type="button"
        className={styles.close}
        onClick={close}
        aria-label="Close expanded diagram"
      >
        <CloseIcon size={14} />
      </button>
      <div
        ref={bodyRef}
        className={wide ? `${styles.body} ${styles.rotateOnPortrait}` : styles.body}
      />
    </dialog>
  );
}

/**
 * Clone the SVG for the modal with all ids suffixed (via suffixSvgIds) so
 * marker definitions don't collide with the inline original.
 */
function cloneForModal(svg: SVGSVGElement, suffix: string): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  suffixSvgIds(clone, suffix);
  return clone;
}
