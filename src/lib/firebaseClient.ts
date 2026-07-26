/**
 * Firebase web-app client, used by the admin panel and the comment
 * "remember me" sign-in. Everything is dynamic-imported behind a click,
 * so the SDK never loads on a public page view — loading it eagerly, or
 * restoring a session on load, would contact Google and break the "no
 * third-party requests until you ask" posture (/privacy). Sign-in is
 * session-scoped and that is ENFORCED here with in-memory persistence:
 * getAuth()'s default would write the account's refresh token to
 * indexedDB where it survives reloads — a stored login token /privacy
 * explicitly denies keeping. With inMemoryPersistence nothing touches
 * disk; a fresh page load starts signed-out until the visitor clicks
 * sign-in again (the remembered name is stored separately, locally).
 * Never "upgrade" this to persistent auth without rewriting /privacy.
 *
 * The config values are public identifiers, not secrets (project
 * dbln-b56ec's web app). authDomain is the site itself: Firebase Hosting
 * auto-serves /__/auth/* on connected custom domains, which keeps the
 * OAuth helper same-origin (and Safari-proof).
 *
 * One-time console setup for a custom authDomain (all required):
 * 1. Auth → Sign-in method → enable Google AND GitHub (the GitHub
 *    provider needs an OAuth app: client id + secret, callback
 *    https://dbln.me/__/auth/handler).
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

export type SignedInUser = {
  uid: string;
  /** The provider's display name, if it gave one. */
  name: string | null;
  getIdToken: () => Promise<string>;
};

export type AuthProvider = "google" | "github";

async function firebaseAuth() {
  const { initializeApp, getApps } = await import("firebase/app");
  const auth = await import("firebase/auth");
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  let instance;
  try {
    // In-memory only (see module docstring). initializeAuth throws if the
    // instance already exists — then getAuth returns the one we made.
    instance = auth.initializeAuth(app, {
      persistence: auth.inMemoryPersistence,
      popupRedirectResolver: auth.browserPopupRedirectResolver,
    });
  } catch {
    instance = auth.getAuth(app);
  }
  return { auth, instance };
}

/** Popup sign-in with the chosen provider → the session's user. */
export async function signInVisitor(
  provider: AuthProvider,
): Promise<SignedInUser> {
  const { auth, instance } = await firebaseAuth();
  const authProvider =
    provider === "github"
      ? new auth.GithubAuthProvider()
      : new auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(instance, authProvider);
  return {
    uid: result.user.uid,
    name: result.user.displayName,
    getIdToken: () => result.user.getIdToken(),
  };
}

/** Admin panel sign-in (Google only). */
export async function signInWithGoogle(): Promise<SignedInUser> {
  return signInVisitor("google");
}

/** Clears the persisted session (Firebase Auth's indexedDB state). */
export async function firebaseSignOut(): Promise<void> {
  const { getApps } = await import("firebase/app");
  const app = getApps()[0];
  if (!app) return;
  const { getAuth, signOut } = await import("firebase/auth");
  await signOut(getAuth(app));
}
