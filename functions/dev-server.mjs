/**
 * Local harness: the real API app on a MemoryStore + the built site from
 * ../out, with cleanUrls emulated (extensions: ["html"]) so /blog/<slug>
 * resolves like it does on Firebase Hosting. Exists because the Firestore
 * emulator needs Java; everything except Firestore itself is the code
 * that ships. GET /__dump exposes the store's records for verification.
 *
 *   npm --prefix functions run serve   (after a site `npm run build`)
 */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const express = require("express");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { createApp } = require("./lib/app.js");
const { consoleMailer } = require("./lib/notify.js");
const { MemoryStore } = require("./lib/store.js");

// No credentials on purpose: verifying an ID token's signature only needs
// Google's public certs + the project id, so a REAL sign-in on the site
// (popup against production Firebase Auth) is testable locally. What this
// cannot do without credentials is checkRevoked — acceptable in dev.
initializeApp({ projectId: "dbln-b56ec" });

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "out");
const port = 4610;

const store = new MemoryStore();
const app = express();
// Comment cooldown shortened so manual testing isn't 30s-gated; the
// notification "email" prints to this console. The admin verifier accepts
// the fixed dev token (AdminPanel's localhost affordance) — no Firebase
// Auth needed to exercise the panel locally.
app.use(
  createApp(store, {
    mailer: consoleMailer(),
    limits: { commentCooldownMs: 2000 },
    // Author badge locally: set DBLN_ADMIN_UIDS to a comma-separated list
    // of uids (your real Firebase uid, or a "devuid:" test id) to see
    // those comments badged "Author".
    adminUids: (process.env.DBLN_ADMIN_UIDS ?? "").split(","),
    verifyAdmin: async (token) =>
      token === "dev-admin" ? "dev-admin-uid" : null,
    // Dev sign-in, two tiers: "devuid:<id>" fakes a user for scripted
    // tests, and anything else is verified as a REAL Firebase ID token
    // (so signing in with the actual Google/GitHub popup works against
    // the harness too).
    verifyVisitor: async (token) => {
      const m = /^devuid:([A-Za-z0-9]{1,40})$/.exec(token ?? "");
      if (m) return m[1];
      try {
        const decoded = await getAuth().verifyIdToken(token);
        return decoded.uid;
      } catch (err) {
        console.log("[auth] id token rejected:", err.code ?? err.message);
        return null;
      }
    },
  }),
);
app.get("/__dump", (req, res) => res.json(store.dump()));
// cleanUrls the way Firebase resolves them: /blog/<slug> serves
// blog/<slug>.html even when a same-named directory (article images)
// exists — express.static alone would redirect into the directory.
app.use((req, res, next) => {
  if (req.method === "GET" && !path.extname(req.path)) {
    const clean = req.path.replace(/\/+$/, "");
    if (clean && existsSync(path.join(out, `${clean}.html`))) {
      req.url = `${clean}.html`;
    }
  }
  next();
});
app.use(express.static(out, { extensions: ["html"], redirect: false }));

app.listen(port, () => {
  console.log(`social harness: http://localhost:${port} (serving ${out})`);
});
