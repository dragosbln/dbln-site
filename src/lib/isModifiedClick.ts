import type { MouseEvent } from "react";

/** Same rule as Next's Link: new-tab/window clicks stay with the browser. */
export function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}
