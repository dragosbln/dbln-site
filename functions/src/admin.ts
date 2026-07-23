import { getAuth } from "firebase-admin/auth";

/**
 * Admin auth. `AdminVerifier` turns a bearer token into an admin uid (or
 * null). Production verifies a Firebase ID token and checks it against an
 * allowlist; tests and the dev harness inject a stub so the admin routes
 * can be exercised without a real Google sign-in.
 */
export type AdminVerifier = (token: string) => Promise<string | null>;

/**
 * Firebase ID token → uid, gated by an allowlist. The allowlist is the
 * ADMIN_UIDS secret (comma-separated); an empty allowlist admits no one,
 * so a missing secret fails closed rather than open.
 */
export function firebaseAdminVerifier(allowUids: string[]): AdminVerifier {
  const allow = new Set(allowUids.map((u) => u.trim()).filter(Boolean));
  return async (token: string) => {
    if (allow.size === 0) return null;
    try {
      const decoded = await getAuth().verifyIdToken(token);
      return allow.has(decoded.uid) ? decoded.uid : null;
    } catch {
      return null;
    }
  };
}

/** Pulls the bearer token out of an Authorization header. */
export function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer (.+)$/.exec(header.trim());
  return match ? match[1] : null;
}
