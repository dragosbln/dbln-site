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
const { createApp } = require("./lib/app.js");
const { consoleMailer } = require("./lib/notify.js");
const { MemoryStore } = require("./lib/store.js");

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
    verifyAdmin: async (token) =>
      token === "dev-admin" ? "dev-admin-uid" : null,
    // Dev sign-in: any token shaped "devuid:<id>" authenticates as <id>,
    // so authed commenting / claim / delete-own are testable without
    // Firebase Auth.
    verifyVisitor: async (token) => {
      const m = /^devuid:([A-Za-z0-9]{1,40})$/.exec(token ?? "");
      return m ? m[1] : null;
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
