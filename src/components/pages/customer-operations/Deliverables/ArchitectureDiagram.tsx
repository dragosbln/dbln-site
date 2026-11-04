import type { ArchitectureLabels } from "@/content/types";
import styles from "./Deliverables.module.css";

/**
 * The design finding's figure: the agent runtime over the refund service
 * (tool and store) over the payment API, with the faulty key derivation
 * marked in red inside the tool. Geometry is the reference's; every text is
 * content.
 */
export default function ArchitectureDiagram({
  labels,
}: {
  labels: ArchitectureLabels;
}) {
  return (
    <svg
      className={styles.architecture}
      viewBox="8 0 246 220"
      role="img"
      aria-label={labels.alt}
    >
      <rect className={styles.node} x="26" y="3" width="112" height="34" rx="5" />
      <text className={styles.nodeTitle} x="82" y="24" textAnchor="middle">
        {labels.runtime}
      </text>
      <path className={styles.edge} d="M82 37V74m-4-6 4 6 4-6" />
      <rect
        className={styles.boundary}
        x="10"
        y="49"
        width="242"
        height="104"
        rx="6"
      />
      <text className={styles.nodeMeta} x="238" y="66" textAnchor="end">
        {labels.service}
      </text>
      <rect className={styles.node} x="26" y="75" width="112" height="62" rx="5" />
      <text className={styles.nodeTitle} x="82" y="96" textAnchor="middle">
        {labels.tool}
      </text>
      <rect
        className={styles.faultFill}
        x="32"
        y="105"
        width="100"
        height="25"
        rx="3"
      />
      <text className={styles.faultText} x="40" y="122">
        {labels.faultFrom}
      </text>
      <path className={styles.faultArrow} d="M83 118H96m-4-3 4 3-4 3" />
      <text className={styles.faultText} x="102" y="122">
        {labels.faultTo}
      </text>
      <path className={`${styles.edge} ${styles.read}`} d="M138 110H169" />
      <path className={styles.edge} d="m163 106 6 4-6 4" />
      <rect className={styles.store} x="170" y="79" width="68" height="54" rx="5" />
      <path className={styles.edge} d="M171 88H237" />
      <text className={styles.nodeTitle} x="204" y="108" textAnchor="middle">
        {labels.store[0]}
      </text>
      <text className={styles.nodeTitle} x="204" y="123" textAnchor="middle">
        {labels.store[1]}
      </text>
      <path className={styles.edge} d="M82 137V168m-4-6 4 6 4-6" />
      <rect className={styles.node} x="26" y="169" width="112" height="49" rx="5" />
      <text className={styles.nodeTitle} x="82" y="190" textAnchor="middle">
        {labels.api}
      </text>
      <text className={styles.nodeMeta} x="82" y="208" textAnchor="middle">
        {labels.apiMeta}
      </text>
    </svg>
  );
}
