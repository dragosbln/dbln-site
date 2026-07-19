import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Proof-of-page-visit token for comment posts. GET /api/comments hands
 * one out; POST /api/comments requires it back. An API-only bot must
 * fetch the thread first and sit through the minimum age, which — with
 * the honeypot and the cooldowns — is the instant-post substitute for a
 * review queue. Tokens are stateless: `<ts>.<hmac(key, ts)>`, so any
 * instance can verify what another minted.
 */

export const TOKEN_MIN_AGE_MS = 5_000;
export const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function sig(key: string, ts: string): string {
  return createHmac("sha256", key).update(ts).digest("hex");
}

export function mintToken(key: string, now: number = Date.now()): string {
  return `${now}.${sig(key, String(now))}`;
}

export function verifyToken(
  key: string,
  token: unknown,
  now: number = Date.now(),
): boolean {
  if (typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const ts = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^\d{10,16}$/.test(ts) || !/^[0-9a-f]{64}$/.test(mac)) return false;
  const expected = Buffer.from(sig(key, ts));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return false;
  }
  const age = now - Number(ts);
  return age >= TOKEN_MIN_AGE_MS && age <= TOKEN_MAX_AGE_MS;
}
