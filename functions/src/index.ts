import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./app";
import { FirestoreStore } from "./firestoreStore";

initializeApp();

const app = createApp(new FirestoreStore(getFirestore()), {
  enforceHost: true,
});

/**
 * Single HTTP function behind the /api/** hosting rewrite. europe-west1
 * to keep the data path in the EU (pair the Firestore location with it).
 * maxInstances caps the blast radius of any traffic surge — this backend
 * is likes (and later comments), not something worth autoscaling for.
 */
export const api = onRequest(
  {
    region: "europe-west1",
    memory: "256MiB",
    maxInstances: 3,
    concurrency: 80,
    invoker: "public",
  },
  app,
);
