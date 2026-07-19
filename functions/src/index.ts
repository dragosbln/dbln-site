import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import type { Express } from "express";
import { createApp } from "./app";
import { FirestoreStore } from "./firestoreStore";
import { gmailMailer } from "./notify";

initializeApp();

/**
 * Secrets (set once with `firebase functions:secrets:set <NAME>`):
 * - SOCIAL_TOKEN_KEY: HMAC key for comment post tokens (any long random
 *   string, e.g. `openssl rand -hex 32`).
 * - GMAIL_USER / GMAIL_APP_PASSWORD: the Gmail account + app password
 *   that sends comment notifications (kept out of the repo on purpose).
 * Deploys fail until all three exist.
 */
const tokenKey = defineSecret("SOCIAL_TOKEN_KEY");
const gmailUser = defineSecret("GMAIL_USER");
const gmailPass = defineSecret("GMAIL_APP_PASSWORD");

/** Public on the site already (site.ts) — not a secret. */
const NOTIFY_TO = "dragos@dbln.me";

const store = new FirestoreStore(getFirestore());

// Secret values are only readable at runtime, so the express app is
// built lazily on the first request of each instance.
let app: Express | null = null;

/**
 * Single HTTP function behind the /api/** hosting rewrite. europe-west1
 * to keep the data path in the EU (pair the Firestore location with it).
 * maxInstances caps the blast radius of any traffic surge — this backend
 * is likes and comments, not something worth autoscaling for.
 */
export const api = onRequest(
  {
    region: "europe-west1",
    memory: "256MiB",
    maxInstances: 3,
    concurrency: 80,
    invoker: "public",
    secrets: [tokenKey, gmailUser, gmailPass],
  },
  (req, res) => {
    if (!app) {
      app = createApp(store, {
        enforceHost: true,
        tokenKey: tokenKey.value(),
        mailer: gmailMailer(gmailUser.value(), gmailPass.value(), NOTIFY_TO),
      });
    }
    return app(req, res);
  },
);
