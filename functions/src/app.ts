import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { SlidingWindow } from "./ratelimit";
import { SLUGS } from "./slugs";
import type { LikeAction, SocialStore } from "./store";

/**
 * The API is reached through the Firebase Hosting rewrite (/api/** →
 * this function), so requests keep the site's own origin and routes
 * carry the full /api prefix. Same-origin is a privacy boundary: the
 * visitor's browser talks to dbln.me only. No CORS headers on purpose —
 * other origins get nothing readable.
 */

const SLUG_SET = new Set(SLUGS);

/** `d_` + uuid v4: the anonymous per-browser id minted by the client. */
const SUBJECT_RE =
  /^d_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Hosts the API serves when enforceHost is on (prod behind the rewrite). */
export function hostAllowed(rawHost: string | undefined): boolean {
  if (!rawHost) return false;
  const host = rawHost.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  if (host === "dbln.me" || host === "www.dbln.me") return true;
  // Live + preview-channel hosts of the Firebase project.
  return (
    host.startsWith("dbln-b56ec") &&
    (host.endsWith(".web.app") || host.endsWith(".firebaseapp.com"))
  );
}

/**
 * Rate-limit key for the caller. Never trust the left of X-Forwarded-For:
 * clients can put anything there and Google's proxies append rather than
 * replace, so the leftmost entry is attacker-controlled (express's
 * `trust proxy: true` + req.ip would return exactly that). The RIGHTMOST
 * entries are appended by the infrastructure the request actually passed
 * through (client → Hosting CDN → function front end) and can't be
 * rotated per request, so the last two entries make a stable key.
 */
export function clientKey(req: Request): string {
  const xff = req.get("x-forwarded-for");
  if (!xff) return req.socket.remoteAddress ?? "?";
  const entries = xff
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return entries.slice(-2).join(",");
}

export type AppOptions = {
  /** Reject requests whose (forwarded) host isn't the site. Off in dev. */
  enforceHost?: boolean;
  /** Rate-limit knobs, lowered by tests. */
  limits?: {
    perSubject?: number;
    perClient?: number;
    global?: number;
    windowMs?: number;
  };
};

export function createApp(store: SocialStore, opts: AppOptions = {}) {
  const windowMs = opts.limits?.windowMs ?? 10 * 60 * 1000;
  const perSubject = new SlidingWindow(opts.limits?.perSubject ?? 30, windowMs);
  const perClient = new SlidingWindow(opts.limits?.perClient ?? 60, windowMs);
  // Absolute write ceiling per instance: whatever a determined caller
  // does to the per-key limits (both are ultimately spoofable), the
  // total damage stays bounded until the admin cleanup.
  const globalCeiling = new SlidingWindow(opts.limits?.global ?? 600, windowMs);

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "2kb" }));

  if (opts.enforceHost) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const host = req.get("x-forwarded-host") ?? req.get("host");
      if (!hostAllowed(host)) {
        res.status(403).json({ error: "forbidden" });
        return;
      }
      next();
    });
  }

  app.get("/api/social/counts", async (req, res, next) => {
    try {
      const likes = await store.getLikeCounts();
      res.set(
        "Cache-Control",
        "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
      );
      res.json({ likes });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/likes", async (req, res, next) => {
    try {
      const { slug, subject, action } = (req.body ?? {}) as Record<
        string,
        unknown
      >;
      if (
        typeof slug !== "string" ||
        typeof subject !== "string" ||
        (action !== "like" && action !== "unlike")
      ) {
        res.status(400).json({ error: "bad_request" });
        return;
      }
      if (!SLUG_SET.has(slug)) {
        res.status(400).json({ error: "unknown_slug" });
        return;
      }
      if (!SUBJECT_RE.test(subject)) {
        res.status(400).json({ error: "bad_subject" });
        return;
      }
      if (
        !perSubject.hit(subject) ||
        !perClient.hit(clientKey(req)) ||
        !globalCeiling.hit("*")
      ) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      const result = await store.toggleLike(slug, subject, action as LikeAction);
      res.set("Cache-Control", "no-store");
      res.json({ likes: result.likes, liked: result.liked });
    } catch (err) {
      next(err);
    }
  });

  // Catch-alls are scoped to /api so the dev harness can mount this app
  // in front of its static file serving and let other paths fall through.
  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({ error: "not_found" });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use("/api", (err: Error, req: Request, res: Response, next: NextFunction) => {
    const parseFailure = "type" in err && err.type === "entity.parse.failed";
    const tooLarge = "type" in err && err.type === "entity.too.large";
    if (parseFailure || tooLarge) {
      res.status(400).json({ error: "bad_request" });
      return;
    }
    console.error("[api]", err);
    res.status(500).json({ error: "internal" });
  });

  return app;
}
