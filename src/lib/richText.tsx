import type { ReactNode } from "react";

/**
 * Renders the inline-markup subset used by content strings in src/content/:
 * **text** -> <strong> (stat emphasis), *text* -> <em>. No nesting, no links —
 * anything richer belongs in a component, not a content string.
 */
export function richText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
