export default function Pie() {
  return (
    <svg
      viewBox="0 0 600 398"
      role="img"
      aria-label="Pie auth re-architecture. Before, retired: the browser with the Amplify SDK spoke SRP directly to Cognito user pools, with tokens in non-httpOnly cookies, readable by any script. After: the unified Next.js app redirects sign-in to Cognito Managed Login, the OAuth 2.0 authorization-code flow returns tokens stored in httpOnly cookies, and an API Gateway authorizer reads the cookie and forwards the token to 100+ backend services."
    >
      <defs>
        <marker id="pie-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8a8c8f" />
        </marker>
      </defs>
      {/* before: SRP in the browser (retired) */}
      <text className="dg-band" x="20" y="28">BEFORE · SRP IN THE BROWSER · RETIRED</text>
      <g className="dg-node legacy"><rect x="20" y="42" width="210" height="56" rx="8" /><text className="t" x="36" y="65">Browser + Amplify SDK</text><text className="s" x="36" y="83">tokens in non-httpOnly cookies</text></g>
      <g className="dg-node legacy"><rect x="370" y="42" width="210" height="56" rx="8" /><text className="t" x="386" y="65">Cognito user pools</text><text className="s" x="386" y="83">hit directly from the SPA</text></g>
      <path className="dg-edge legacy" d="M230 76 L370 76" markerStart="url(#pie-ah)" markerEnd="url(#pie-ah)" />
      <text className="dg-note" x="300" y="64" textAnchor="middle">SRP challenge/response</text>
      {/* transition */}
      <path className="dg-edge" d="M300 112 L300 164" markerEnd="url(#pie-ah)" />
      <text className="dg-note" x="312" y="141">re-architected</text>
      {/* after: OAuth 2.0 on Managed Login */}
      <text className="dg-band live" x="20" y="172">AFTER · OAUTH 2.0 ON MANAGED LOGIN</text>
      <g className="dg-node key"><rect x="20" y="182" width="150" height="56" rx="8" /><text className="t" x="36" y="205">Next.js app</text><text className="s" x="36" y="223">unified frontend</text></g>
      <g className="dg-node key"><rect x="225" y="182" width="150" height="56" rx="8" /><text className="t" x="241" y="205">Managed Login</text><text className="s" x="241" y="223">Cognito hosted UI</text></g>
      <g className="dg-node key"><rect x="430" y="182" width="150" height="56" rx="8" /><text className="t" x="446" y="205">User pools</text><text className="s" x="446" y="223">multi-pool</text></g>
      <path className="dg-edge" d="M170 196 L225 196" markerEnd="url(#pie-ah)" />
      <path className="dg-flow run" d="M170 196 L225 196" />
      <path className="dg-edge" d="M225 224 L170 224" markerEnd="url(#pie-ah)" />
      <path className="dg-flow run" d="M225 224 L170 224" />
      <path className="dg-edge" d="M375 210 L430 210" markerEnd="url(#pie-ah)" />
      <path className="dg-flow run" d="M375 210 L430 210" />
      <g className="dg-step"><circle cx="197.5" cy="196" r="8" /><text x="197.5" y="199">1</text></g>
      <g className="dg-step"><circle cx="197.5" cy="224" r="8" /><text x="197.5" y="227">2</text></g>
      {/* authenticated calls into the platform */}
      <g className="dg-node key"><rect x="225" y="294" width="150" height="56" rx="8" /><text className="t" x="241" y="317">API Gateway</text><text className="s" x="241" y="335">token authorizer</text></g>
      <g className="dg-node"><rect x="430" y="294" width="150" height="56" rx="8" /><text className="t" x="446" y="317">100+ services</text><text className="s" x="446" y="335">backend microservices</text></g>
      <path className="dg-edge" d="M95 238 L95 322 L225 322" markerEnd="url(#pie-ah)" />
      <path className="dg-flow run" d="M95 238 L95 322 L225 322" />
      <path className="dg-edge" d="M375 322 L430 322" markerEnd="url(#pie-ah)" />
      <path className="dg-flow run" d="M375 322 L430 322" />
      <g className="dg-step"><circle cx="95" cy="278" r="8" /><text x="95" y="281">3</text></g>
      <g className="dg-step"><circle cx="402.5" cy="322" r="8" /><text x="402.5" y="325">4</text></g>
      <text className="dg-note" x="20" y="346">1 · sign-in redirect</text>
      <text className="dg-note" x="20" y="360">2 · code → httpOnly token cookies</text>
      <text className="dg-note" x="20" y="374">3 · calls carry the cookie</text>
      <text className="dg-note" x="20" y="388">4 · authorizer reads + forwards</text>
    </svg>
  );
}
