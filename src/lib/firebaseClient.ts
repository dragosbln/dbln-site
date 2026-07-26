/**
 * Firebase web-app client, used ONLY by the admin panel (and later the
 * comment "remember me" sign-in). Everything is dynamic-imported behind a
 * click, so the SDK never loads on a public page view — loading it eagerly
 * would break the "no third-party requests" posture (/privacy).
 *
 * The config values are public identifiers, not secrets (project
 * dbln-b56ec's web app). authDomain is the site itself: Firebase Hosting
 * auto-serves /__/auth/* on connected custom domains, which keeps the
 * OAuth helper same-origin (and Safari-proof).
 *
 * One-time console setup for a custom authDomain (all required):
 * 1. Auth → Sign-in method → enable Google.
 * 2. Auth → Settings → Authorized domains → add dbln.me.
 * 3. Google Cloud → Credentials → the auto-created OAuth web client →
 *    Authorized redirect URIs → add https://dbln.me/__/auth/handler.
 *    (Connecting a Hosting custom domain does NOT add this; without it the
 *    Google popup returns redirect_uri_mismatch.)
 */
const firebaseConfig = {
  apiKey: "AIzaSyAyoQy1_YuU-5h0vA7QNIAzZGCobc-pxGM",
  authDomain: "dbln.me",
  projectId: "dbln-b56ec",
  appId: "1:834648647894:web:dec20a718ca2ff9475c177",
};

/** Google sign-in popup → the signed-in user's { uid, getIdToken }. */
export async function signInWithGoogle(): Promise<{
  uid: string;
  getIdToken: () => Promise<string>;
}> {
  const { initializeApp, getApps } = await import("firebase/app");
  const { getAuth, GoogleAuthProvider, signInWithPopup } = await import(
    "firebase/auth"
  );
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return {
    uid: result.user.uid,
    getIdToken: () => result.user.getIdToken(),
  };
}

/** Clears the persisted session (Firebase Auth's indexedDB state). */
export async function signOutAdmin(): Promise<void> {
  const { getApps } = await import("firebase/app");
  const app = getApps()[0];
  if (!app) return;
  const { getAuth, signOut } = await import("firebase/auth");
  await signOut(getAuth(app));
}
