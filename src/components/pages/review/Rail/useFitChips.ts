import {
  type DependencyList,
  type RefObject,
  useEffect,
  useLayoutEffect,
} from "react";

/**
 * Shrinks every chip whose text wraps to the width of its longest line (the
 * prototype's `fitChips`). A wrapping inline-flex box keeps the full width
 * it had before the text broke, so a two-line chip would carry an empty
 * strip on its right; CSS has no "shrink to the longest line" sizing, so the
 * width has to be measured.
 */
function fitChips(root: HTMLElement, chipClass: string) {
  const chips = Array.from(root.getElementsByClassName(chipClass)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );

  // A width left from the last fit would cap the natural width measured now.
  for (const chip of chips) chip.style.width = "";

  // Read every chip first, then write: one forced layout for the whole rail
  // instead of one per chip. A chip's width depends only on its group's
  // width (siblings wrap to new lines, they never squeeze it).
  const widths = chips.map((chip) => {
    // Chips in a closed panel or the inactive reading are display:none and
    // measure 0; fitting them would pin them at 1px.
    if (chip.offsetParent === null) return null;
    const text = chip.querySelector("span");
    if (!text) return null;
    const range = document.createRange();
    range.selectNodeContents(text);
    let longest = 0;
    for (const line of range.getClientRects()) {
      longest = Math.max(longest, line.width);
    }
    if (!longest) return null;
    // Border, padding, icon and gap: everything in the chip but the text.
    const chrome =
      chip.getBoundingClientRect().width - text.getBoundingClientRect().width;
    return Math.ceil(longest + chrome + 1);
  });

  chips.forEach((chip, i) => {
    const width = widths[i];
    if (width !== null) chip.style.width = `${width}px`;
  });
}

/**
 * Fits the chips (elements with `chipClass`) inside `rootRef` after every
 * render that changes `deps`, after the web fonts land and on resize.
 *
 * `el.style.width` is the one sanctioned inline style on the page: it is a
 * measured layout value, not a design value, so it cannot live in the
 * stylesheet. The fit runs in a layout effect so the corrected width lands
 * before paint; a plain effect would show the wide chip for a frame and then
 * snap. Effects never run during the server render, and the server markup
 * carries no widths (every panel starts closed), so hydration matches.
 */
export default function useFitChips(
  rootRef: RefObject<HTMLElement | null>,
  chipClass: string,
  deps: DependencyList,
) {
  useLayoutEffect(
    () => {
      if (rootRef.current) fitChips(rootRef.current, chipClass);
    },
    // The caller's deps are the layout triggers (which panels and which
    // reading are visible); the fit itself reads everything from the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    let frame = 0;
    let live = true;
    // Resize fires many times per frame; one fit before the next paint is
    // enough.
    function refit() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (rootRef.current) fitChips(rootRef.current, chipClass);
      });
    }
    // The fallback font wraps differently; fit again once the real one lands.
    document.fonts.ready.then(() => {
      if (live) refit();
    });
    window.addEventListener("resize", refit);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", refit);
    };
  }, [rootRef, chipClass]);
}
