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
 * the dg-* classes styled in CaseDiagram.module.css), register it here, and
 * give the case a `diagram: { caption }` in src/content/work.ts.
 */
const DIAGRAMS: Record<string, ComponentType> = {
  pie: Pie,
  bullseye: Bullseye,
  parentool: Parentool,
  glede: Glede,
  reach: Reach,
  equinet: Equinet,
};

type CaseDiagramProps = {
  id: string;
  /** figcaption text — outward-facing copy, sourced from src/content/work.ts. */
  caption: string;
};

export default function CaseDiagram({ id, caption }: CaseDiagramProps) {
  const Svg = DIAGRAMS[id];
  if (!Svg) return null;
  return (
    <figure className={styles.figure}>
      <Svg />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
