import type { ComponentType } from "react";
import Bullseye from "./Bullseye";
import Equinet from "./Equinet";
import Glede from "./Glede";
import Parentool from "./Parentool";
import Pie from "./Pie";
import Reach from "./Reach";
import styles from "./CaseDiagram.module.css";

/**
 * One animated SVG diagram per case study, keyed by the case id from
 * src/content/work.ts. To add one: create <Name>.tsx in this folder
 * (plain <svg> with role="img" + aria-label narrating the diagram, using
 * the dg-* classes styled in CaseDiagram.module.css), then register it
 * here with its figcaption.
 */
const DIAGRAMS: Record<string, { svg: ComponentType; caption: string }> = {
  pie: {
    svg: Pie,
    caption:
      "fig. tokens moved from JS-readable cookies to httpOnly; auth from browser SRP to OAuth 2.0 on Managed Login.",
  },
  bullseye: {
    svg: Bullseye,
    caption:
      "fig. one blueprint per module, a database per module, events in between; the rest deliberately left out.",
  },
  parentool: {
    svg: Parentool,
    caption:
      "fig. Firebase direct for the everyday; Cloud Functions as the gate for paid ops and the OpenAI chatbot.",
  },
  glede: {
    svg: Glede,
    caption:
      "fig. migrate module by module, shift users gradually, ship the new stuff in the new codebase only.",
  },
  reach: {
    svg: Reach,
    caption:
      "fig. reactive calculations on-device, proprietary ones on AWS next to the data; one UI, matching numbers.",
  },
  equinet: {
    svg: Equinet,
    caption:
      "fig. two devices, one org: offline edits queue locally, conflicts resolve centrally, every device converges.",
  },
};

type CaseDiagramProps = {
  id: string;
};

export default function CaseDiagram({ id }: CaseDiagramProps) {
  const entry = DIAGRAMS[id];
  if (!entry) return null;
  const Svg = entry.svg;
  return (
    <figure className={styles.figure}>
      <Svg />
      <figcaption>{entry.caption}</figcaption>
    </figure>
  );
}
