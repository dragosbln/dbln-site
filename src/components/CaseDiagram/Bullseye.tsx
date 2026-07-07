export default function Bullseye() {
  return (
    <svg
      viewBox="0 0 600 342"
      role="img"
      aria-label="Bullseye backend: modules with an identical internal blueprint of API, service and data-access layers, each owning its own database; three modules share one deployable. Client apps call the module APIs; modules exchange async events. Deliberately left out: an orchestrator, and custom websockets, replaced by Firebase Cloud Messaging."
    >
      {/* client traffic fanning into the module APIs */}
      <g className="dg-chip plain"><rect x="40" y="8" width="20" height="9" rx="2" /><rect x="68" y="8" width="20" height="9" rx="2" /><rect x="96" y="8" width="20" height="9" rx="2" /><rect x="124" y="8" width="20" height="9" rx="2" /></g>
      <g className="dg-chip plain"><rect x="250" y="8" width="20" height="9" rx="2" /><rect x="278" y="8" width="20" height="9" rx="2" /><rect x="306" y="8" width="20" height="9" rx="2" /><rect x="334" y="8" width="20" height="9" rx="2" /></g>
      <g className="dg-chip plain"><rect x="470" y="8" width="20" height="9" rx="2" /><rect x="498" y="8" width="20" height="9" rx="2" /><rect x="526" y="8" width="20" height="9" rx="2" /><rect x="554" y="8" width="20" height="9" rx="2" /></g>
      <text className="dg-note" x="197" y="15" textAnchor="middle">client apps</text>
      <path className="dg-wire" d="M50 17 L55 72" /><path className="dg-wire" d="M78 17 L75 72" /><path className="dg-wire" d="M106 17 L95 72" /><path className="dg-wire" d="M134 17 L115 72" />
      <path className="dg-wire" d="M260 17 L270 72" /><path className="dg-wire" d="M288 17 L290 72" /><path className="dg-wire" d="M316 17 L310 72" /><path className="dg-wire" d="M344 17 L330 72" />
      <path className="dg-wire" d="M480 17 L485 72" /><path className="dg-wire" d="M508 17 L505 72" /><path className="dg-wire" d="M536 17 L525 72" /><path className="dg-wire" d="M564 17 L545 72" />
      {/* modules: same blueprint, own DB */}
      <g className="dg-node"><rect x="20" y="42" width="130" height="150" rx="8" /><text className="t" x="32" y="62">Users</text></g>
      <g className="dg-node"><rect x="180" y="42" width="240" height="150" rx="8" /><text className="t" x="192" y="62">Three modules, co-deployed</text></g>
      <g className="dg-node"><rect x="450" y="42" width="130" height="150" rx="8" /><text className="t" x="462" y="62">Tasks</text></g>
      <g className="dg-cell">
        <rect x="30" y="72" width="110" height="16" rx="3" /><text x="85" y="83">API</text>
        <rect x="30" y="94" width="110" height="16" rx="3" /><text x="85" y="105">service</text>
        <rect x="30" y="116" width="110" height="16" rx="3" /><text x="85" y="127">data access</text>
        <rect x="190" y="72" width="220" height="16" rx="3" /><text x="300" y="83">API</text>
        <rect x="190" y="94" width="220" height="16" rx="3" /><text x="300" y="105">service</text>
        <rect x="190" y="116" width="220" height="16" rx="3" /><text x="300" y="127">data access</text>
        <rect x="460" y="72" width="110" height="16" rx="3" /><text x="515" y="83">API</text>
        <rect x="460" y="94" width="110" height="16" rx="3" /><text x="515" y="105">service</text>
        <rect x="460" y="116" width="110" height="16" rx="3" /><text x="515" y="127">data access</text>
      </g>
      <g className="dg-chip">
        <rect x="53" y="144" width="64" height="20" rx="4" /><text x="85" y="157">own DB</text>
        <rect x="200" y="144" width="56" height="20" rx="4" /><text x="228" y="157">DB</text>
        <rect x="272" y="144" width="56" height="20" rx="4" /><text x="300" y="157">DB</text>
        <rect x="344" y="144" width="56" height="20" rx="4" /><text x="372" y="157">DB</text>
        <rect x="483" y="144" width="64" height="20" rx="4" /><text x="515" y="157">own DB</text>
      </g>
      {/* async events between modules */}
      <path className="dg-edge" d="M85 192 L85 232" />
      <path className="dg-edge" d="M300 192 L300 232" />
      <path className="dg-edge" d="M515 192 L515 232" />
      <path className="dg-edge" d="M85 232 L515 232" />
      <path className="dg-flow run" d="M85 232 L515 232" />
      <text className="dg-note" x="300" y="250" textAnchor="middle">async events, module to module</text>
      {/* deliberately not built */}
      <text className="dg-band" x="20" y="274">LEFT OUT ON PURPOSE</text>
      <g className="dg-node legacy"><rect x="20" y="284" width="175" height="46" rx="8" /><text className="t" x="36" y="304">Orchestrator</text><text className="s" x="36" y="320">ran without one</text></g>
      <g className="dg-node legacy"><rect x="215" y="284" width="185" height="46" rx="8" /><text className="t" x="231" y="304">Custom websockets</text><text className="s" x="231" y="320">FCM did the job</text></g>
      <text className="dg-note" x="425" y="300">nothing built for a growth</text>
      <text className="dg-note" x="425" y="314">curve we hadn&apos;t seen yet</text>
    </svg>
  );
}
