export default function Glede() {
  return (
    <svg
      viewBox="0 0 600 262"
      role="img"
      aria-label="Glede migration: a struggling live codebase serving 30,000+ users is migrated module by module — gifting and redeem already moved, payments next — while user traffic shifts gradually from the old codebase to the new one. New features, B2B and Apple Wallet redemption, ship in the new codebase only; the old one gets critical fixes only."
    >
      <defs>
        <marker id="gle-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8a8c8f" />
        </marker>
      </defs>
      <text className="dg-band" x="20" y="28">LIVE THE WHOLE TIME · NO BIG-BANG REWRITE</text>
      {/* progressive rollout: traffic shifting */}
      <g className="dg-chip"><rect x="242" y="40" width="116" height="22" rx="4" /><text x="300" y="55">30,000+ users</text></g>
      <path className="dg-edge legacy" d="M300 62 L300 78 L140 78 L140 100" markerEnd="url(#gle-ah)" />
      <path className="dg-edge" d="M300 62 L300 78 L460 78 L460 100" markerEnd="url(#gle-ah)" />
      <path className="dg-flow run" d="M300 62 L300 78 L460 78 L460 100" />
      <text className="dg-note" x="220" y="72" textAnchor="middle">shrinking share</text>
      <text className="dg-note" x="380" y="72" textAnchor="middle">growing share</text>
      {/* old codebase, module by module out */}
      <g className="dg-node legacy"><rect x="20" y="100" width="240" height="150" rx="8" /><text className="t" x="32" y="120">Old codebase</text></g>
      <g className="dg-cell ghost"><rect x="30" y="134" width="220" height="16" rx="3" /><text x="140" y="145">gifting → moved</text></g>
      <g className="dg-cell ghost"><rect x="30" y="156" width="220" height="16" rx="3" /><text x="140" y="167">redeem → moved</text></g>
      <g className="dg-cell"><rect x="30" y="178" width="220" height="16" rx="3" /><text x="140" y="189">payments · next</text></g>
      <text className="dg-note" x="30" y="218">critical fixes only, no new work</text>
      {/* new codebase, features land here */}
      <g className="dg-node key"><rect x="340" y="100" width="240" height="150" rx="8" /><text className="t" x="352" y="120">New codebase</text></g>
      <g className="dg-cell"><rect x="350" y="134" width="220" height="16" rx="3" /><text x="460" y="145">gifting · migrated</text></g>
      <g className="dg-cell"><rect x="350" y="156" width="220" height="16" rx="3" /><text x="460" y="167">redeem · migrated</text></g>
      <g className="dg-cell ghost"><rect x="350" y="178" width="220" height="16" rx="3" /><text x="460" y="189">payments · incoming</text></g>
      <g className="dg-chip">
        <rect x="350" y="206" width="100" height="20" rx="4" /><text x="400" y="219">B2B · new</text>
        <rect x="462" y="206" width="108" height="20" rx="4" /><text x="516" y="219">Apple Wallet · new</text>
      </g>
      {/* one module at a time */}
      <path className="dg-edge" d="M260 142 L340 142" markerEnd="url(#gle-ah)" />
      <path className="dg-edge" d="M260 164 L340 164" markerEnd="url(#gle-ah)" />
      <path className="dg-edge" d="M260 186 L340 186" markerEnd="url(#gle-ah)" />
      <path className="dg-flow run" d="M260 186 L340 186" />
    </svg>
  );
}
