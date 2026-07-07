export default function Reach() {
  return (
    <svg
      viewBox="0 0 600 282"
      role="img"
      aria-label="Reach Finance architecture: a React Native app renders financial projections and graphs. Reactive pieces recalculate on-device the instant a user adjusts a goal, with no round trip. The heavier proprietary calculations run on the AWS backend next to the financial data. The app requests full projections and merges the results into the same UI, and both calculation paths have to show the same numbers."
    >
      <defs>
        <marker id="rea-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8a8c8f" />
        </marker>
      </defs>
      <text className="dg-band" x="20" y="28">ONE EXPERIENCE, TWO CALCULATION PATHS</text>
      {/* the trigger */}
      <g className="dg-chip"><rect x="60" y="40" width="160" height="22" rx="4" /><text x="140" y="55">user adjusts a goal</text></g>
      <path className="dg-edge" d="M140 62 L140 84" markerEnd="url(#rea-ah)" />
      <path className="dg-flow run" d="M140 62 L140 84" />
      <g className="dg-step"><circle cx="140" cy="73" r="8" /><text x="140" y="76">1</text></g>
      {/* the app: fast path */}
      <g className="dg-node key"><rect x="20" y="84" width="240" height="150" rx="8" /><text className="t" x="32" y="104">React Native app</text></g>
      <g className="dg-cell">
        <rect x="30" y="118" width="220" height="16" rx="3" /><text x="140" y="129">projections + graphs UI</text>
        <rect x="30" y="140" width="220" height="16" rx="3" /><text x="140" y="151">client calc engine · instant</text>
      </g>
      <text className="dg-note" x="30" y="180">reactive pieces recalc</text>
      <text className="dg-note" x="30" y="194">on-device, no round trip</text>
      {/* the backend: heavy path */}
      <g className="dg-node key"><rect x="340" y="84" width="240" height="150" rx="8" /><text className="t" x="352" y="104">AWS backend</text></g>
      <g className="dg-cell">
        <rect x="350" y="118" width="220" height="16" rx="3" /><text x="460" y="129">proprietary calc engine</text>
        <rect x="350" y="140" width="220" height="16" rx="3" /><text x="460" y="151">financial data · DB</text>
      </g>
      <text className="dg-note" x="350" y="180">the heavy models run</text>
      <text className="dg-note" x="350" y="194">next to the data</text>
      {/* kept in sync */}
      <path className="dg-edge" d="M260 126 L340 126" markerEnd="url(#rea-ah)" />
      <path className="dg-flow run" d="M260 126 L340 126" />
      <path className="dg-edge" d="M340 148 L260 148" markerEnd="url(#rea-ah)" />
      <path className="dg-flow run" d="M340 148 L260 148" />
      <g className="dg-step"><circle cx="300" cy="126" r="8" /><text x="300" y="129">2</text></g>
      <g className="dg-step"><circle cx="300" cy="148" r="8" /><text x="300" y="151">3</text></g>
      <text className="dg-note" x="300" y="252" textAnchor="middle">both paths have to show the same numbers</text>
      <text className="dg-note" x="20" y="272" xmlSpace="preserve">1 · instant recalcs   2 · full projection   3 · results merged back</text>
    </svg>
  );
}
