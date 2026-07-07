export default function Parentool() {
  return (
    <svg
      viewBox="0 0 600 368"
      role="img"
      aria-label="Parentool app architecture: a React Native app from one codebase for iOS and Android talks directly to Firebase for auth, Firestore data, storage and FCM push. Paid operations, like unlocking specialist conversations, are gated through a custom Cloud Functions backend that checks before writing. The chatbot also runs through functions, calling OpenAI with articles from Firestore as reference context."
    >
      <defs>
        <marker id="par-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8a8c8f" />
        </marker>
      </defs>
      {/* the app: one codebase, two stores */}
      <g className="dg-node key"><rect x="20" y="42" width="150" height="110" rx="8" /><text className="t" x="32" y="62">React Native app</text><text className="s" x="32" y="78">one codebase</text></g>
      <g className="dg-chip">
        <rect x="34" y="112" width="52" height="20" rx="4" /><text x="60" y="125">iOS</text>
        <rect x="96" y="112" width="62" height="20" rx="4" /><text x="127" y="125">Android</text>
      </g>
      {/* firebase platform */}
      <g className="dg-node"><rect x="400" y="42" width="180" height="140" rx="8" /><text className="t" x="412" y="58">Firebase</text></g>
      <g className="dg-cell">
        <rect x="410" y="64" width="160" height="16" rx="3" /><text x="490" y="75">Auth</text>
        <rect x="410" y="86" width="160" height="16" rx="3" /><text x="490" y="97">Firestore</text>
        <rect x="410" y="108" width="160" height="16" rx="3" /><text x="490" y="119">Storage</text>
        <rect x="410" y="130" width="160" height="16" rx="3" /><text x="490" y="141">FCM · push</text>
      </g>
      {/* the gate */}
      <g className="dg-node key"><rect x="20" y="224" width="170" height="56" rx="8" /><text className="t" x="36" y="247">Cloud Functions</text><text className="s" x="36" y="263">gates the paid operations</text></g>
      <g className="dg-node key"><rect x="400" y="296" width="180" height="48" rx="8" /><text className="t" x="416" y="317">OpenAI</text><text className="s" x="416" y="333">chatbot</text></g>
      {/* 1 · everyday traffic, both directions */}
      <path className="dg-edge" d="M170 80 L400 80" markerEnd="url(#par-ah)" />
      <path className="dg-flow run" d="M170 80 L400 80" />
      <path className="dg-edge" d="M400 138 L170 138" markerEnd="url(#par-ah)" />
      <path className="dg-flow run" d="M400 138 L170 138" />
      <g className="dg-step"><circle cx="285" cy="80" r="8" /><text x="285" y="83">1</text></g>
      {/* 2 · paid ops through the gate */}
      <path className="dg-edge" d="M95 152 L95 224" markerEnd="url(#par-ah)" />
      <path className="dg-flow run" d="M95 152 L95 224" />
      <g className="dg-step"><circle cx="95" cy="188" r="8" /><text x="95" y="191">2</text></g>
      <text className="dg-note" x="118" y="191">e.g. pay to unlock a specialist</text>
      <path className="dg-edge" d="M190 238 L490 238 L490 182" markerEnd="url(#par-ah)" />
      <path className="dg-flow run" d="M190 238 L490 238 L490 182" />
      <text className="dg-note" x="300" y="232" textAnchor="middle">gated writes, after checks</text>
      <path className="dg-edge" d="M530 182 L530 266 L190 266" markerEnd="url(#par-ah)" />
      <path className="dg-flow run" d="M530 182 L530 266 L190 266" />
      <text className="dg-note" x="330" y="260" textAnchor="middle">articles from Firestore, as context</text>
      {/* 3 · the chatbot */}
      <path className="dg-edge" d="M105 280 L105 320 L400 320" markerEnd="url(#par-ah)" />
      <path className="dg-flow run" d="M105 280 L105 320 L400 320" />
      <g className="dg-step"><circle cx="105" cy="300" r="8" /><text x="105" y="303">3</text></g>
      <text className="dg-note" x="20" y="360" xmlSpace="preserve">1 · everyday traffic   2 · paid unlocks, gated   3 · chatbot with article context</text>
    </svg>
  );
}
