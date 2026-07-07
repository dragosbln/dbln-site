export default function Equinet() {
  return (
    <svg
      viewBox="0 0 600 300"
      role="img"
      aria-label="Equinet offline-first sync: two devices edit the same organization record while offline, each queueing edits in a local store. Back online, both sets of edits converge into a sync and conflict-resolution layer, and one resolved organization state returns to every device."
    >
      <defs>
        <marker id="equ-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8a8c8f" />
        </marker>
      </defs>
      <text className="dg-band" x="20" y="26">OFFLINE FIRST · TWO DEVICES, ONE ORG</text>
      <text className="dg-note" x="300" y="44" textAnchor="middle">both edit the same record, offline</text>
      {/* two devices editing the same record */}
      <g className="dg-node"><rect x="20" y="58" width="240" height="72" rx="8" /><text className="t" x="32" y="80">Device A · offline</text></g>
      <g className="dg-cell"><rect x="30" y="92" width="220" height="16" rx="3" /><text x="140" y="103">local store · edits queue up</text></g>
      <g className="dg-node"><rect x="340" y="58" width="240" height="72" rx="8" /><text className="t" x="352" y="80">Device B · offline</text></g>
      <g className="dg-cell"><rect x="350" y="92" width="220" height="16" rx="3" /><text x="460" y="103">local store · edits queue up</text></g>
      {/* back online */}
      <path className="dg-edge legacy" d="M20 158 L580 158" />
      <text className="dg-band" x="300" y="152" textAnchor="middle">BACK ONLINE</text>
      {/* edits converge into the sync layer */}
      <path className="dg-edge" d="M140 130 L215 188" markerEnd="url(#equ-ah)" />
      <path className="dg-flow run" d="M140 130 L215 188" />
      <path className="dg-edge" d="M460 130 L385 188" markerEnd="url(#equ-ah)" />
      <path className="dg-flow run" d="M460 130 L385 188" />
      <g className="dg-node key"><rect x="140" y="188" width="320" height="54" rx="8" /><text className="t" x="156" y="211">Sync + conflict resolution</text><text className="s" x="156" y="227">the actual hard part</text></g>
      {/* one resolved state back to every device */}
      <path className="dg-edge" d="M300 242 L300 264" markerEnd="url(#equ-ah)" />
      <path className="dg-flow run" d="M300 242 L300 264" />
      <g className="dg-chip"><rect x="210" y="264" width="180" height="22" rx="4" /><text x="300" y="279">one org state, everywhere</text></g>
    </svg>
  );
}
