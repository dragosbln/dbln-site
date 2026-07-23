import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { bearer, type AdminVerifier } from "./admin";
import type { Mailer } from "./notify";
import { SlidingWindow } from "./ratelimit";
import { SLUGS } from "./slugs";
import { mintToken, verifyToken } from "./token";
import type { CommentStatus, LikeAction, SocialStore } from "./store";

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

const NAME_MAX = 60;
const BODY_MAX = 1200;
const LINK_MAX = 3;

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

/** Strip control characters; comments keep their newlines. */
function clean(value: string, keepNewlines: boolean): string {
  return (
    keepNewlines
      ? value.replace(/[^\P{C}\n\r]/gu, "")
      : value.replace(/\p{C}/gu, "")
  ).trim();
}

export type AppOptions = {
  /** Reject requests whose (forwarded) host isn't the site. Off in dev. */
  enforceHost?: boolean;
  /** HMAC key for comment tokens. Prod passes the Secret Manager value. */
  tokenKey?: string;
  /** Comment notifications; null/undefined = don't send (dev, tests). */
  mailer?: Mailer | null;
  /** Turns a bearer token into an admin uid. Absent = admin API off (404). */
  verifyAdmin?: AdminVerifier;
  /** Rate-limit knobs, lowered by tests. */
  limits?: {
    perSubject?: number;
    perClient?: number;
    global?: number;
    commentsPerSubject?: number;
    commentsPerClient?: number;
    commentsGlobal?: number;
    commentCooldownMs?: number;
    windowMs?: number;
  };
};

export function createApp(store: SocialStore, opts: AppOptions = {}) {
  const windowMs = opts.limits?.windowMs ?? 10 * 60 * 1000;
  const tokenKey = opts.tokenKey ?? "dev-only-token-key";
  const perSubject = new SlidingWindow(opts.limits?.perSubject ?? 30, windowMs);
  const perClient = new SlidingWindow(opts.limits?.perClient ?? 60, windowMs);
  // Absolute write ceilings per instance: whatever a determined caller
  // does to the per-key limits (both are ultimately spoofable), the
  // total damage stays bounded until the admin cleanup.
  const globalCeiling = new SlidingWindow(opts.limits?.global ?? 600, windowMs);
  const commentsPerSubject = new SlidingWindow(
    opts.limits?.commentsPerSubject ?? 20,
    windowMs,
  );
  const commentsPerClient = new SlidingWindow(
    opts.limits?.commentsPerClient ?? 30,
    windowMs,
  );
  const commentsGlobal = new SlidingWindow(
    opts.limits?.commentsGlobal ?? 120,
    windowMs,
  );
  const commentCooldown = new SlidingWindow(
    1,
    opts.limits?.commentCooldownMs ?? 30_000,
  );

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "8kb" }));

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
      const counts = await store.getCounts();
      res.set(
        "Cache-Control",
        "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
      );
      res.json(counts);
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

  app.get("/api/comments", async (req, res, next) => {
    try {
      const slug = req.query.slug;
      if (typeof slug !== "string" || !SLUG_SET.has(slug)) {
        res.status(400).json({ error: "unknown_slug" });
        return;
      }
      const comments = await store.getComments(slug);
      // no-store: the response carries a fresh post token, and a thread
      // must read back instantly consistent after a post.
      res.set("Cache-Control", "no-store");
      res.json({ comments, token: mintToken(tokenKey) });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/comments", async (req, res, next) => {
    try {
      const raw = (req.body ?? {}) as Record<string, unknown>;
      const { slug, subject, token, website } = raw;
      // Honeypot: an invisible "website" field humans never fill.
      if (typeof website === "string" && website !== "") {
        res.status(400).json({ error: "bad_request" });
        return;
      }
      if (typeof slug !== "string" || typeof subject !== "string") {
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
      const name = typeof raw.name === "string" ? clean(raw.name, false) : "";
      const body = typeof raw.body === "string" ? clean(raw.body, true) : "";
      if (name.length < 1 || name.length > NAME_MAX) {
        res.status(400).json({ error: "bad_name" });
        return;
      }
      if (body.length < 1 || body.length > BODY_MAX) {
        res.status(400).json({ error: "bad_body" });
        return;
      }
      if ((body.match(/https?:\/\//gi) ?? []).length > LINK_MAX) {
        res.status(400).json({ error: "too_many_links" });
        return;
      }
      let parentId: string | null = null;
      if (raw.parentId != null) {
        if (
          typeof raw.parentId !== "string" ||
          !/^[A-Za-z0-9]{1,40}$/.test(raw.parentId)
        ) {
          res.status(400).json({ error: "bad_request" });
          return;
        }
        parentId = raw.parentId;
      }
      if (!verifyToken(tokenKey, token)) {
        res.status(400).json({ error: "token" });
        return;
      }
      if (
        !commentCooldown.hit(subject) ||
        !commentsPerSubject.hit(subject) ||
        !commentsPerClient.hit(clientKey(req)) ||
        !commentsGlobal.hit("*")
      ) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      const result = await store.addComment({
        slug,
        parentId,
        name,
        body,
        subject,
      });
      res.set("Cache-Control", "no-store");
      if (!result.ok) {
        res
          .status(result.error === "thread_closed" ? 409 : 400)
          .json({ error: result.error });
        return;
      }
      res.json({ comment: result.comment });
      // After the response: a mail outage must never fail a post.
      opts.mailer
        ?.send({
          subject: `New comment on ${slug}`,
          text:
            `${name} · ${result.comment.at}\n\n${body}\n\n` +
            `https://dbln.me/blog/${slug}\n` +
            `comment ${result.comment.id}` +
            (parentId ? ` (reply to ${parentId})` : ""),
        })
        .catch((err) => console.error("[notify]", err));
    } catch (err) {
      next(err);
    }
  });

  // ---- Admin API (phase 3) ----
  // Mounted only when a verifier is provided. Every route sits behind a
  // gate that turns the bearer token into an admin uid (Firebase ID token
  // + allowlist in prod) — no session, no cookie, verified per request.
  if (opts.verifyAdmin) {
    const verifyAdmin = opts.verifyAdmin;
    const admin = express.Router();

    admin.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = bearer(req.get("authorization"));
        const uid = token ? await verifyAdmin(token) : null;
        if (!uid) {
          res.status(401).json({ error: "unauthorized" });
          return;
        }
        res.set("Cache-Control", "no-store");
        next();
      } catch (err) {
        next(err);
      }
    });

    admin.get("/overview", async (req, res, next) => {
      try {
        const [counts, comments, likeEvents] = await Promise.all([
          store.getCounts(),
          store.listComments({ limit: 200 }),
          store.listLikeEvents(100),
        ]);
        res.json({ counts, comments, likeEvents });
      } catch (err) {
        next(err);
      }
    });

    admin.get("/comments", async (req, res, next) => {
      try {
        const slug =
          typeof req.query.slug === "string" ? req.query.slug : undefined;
        const comments = await store.listComments({ slug, limit: 500 });
        res.json({ comments });
      } catch (err) {
        next(err);
      }
    });

    const statusRoute =
      (status: CommentStatus) =>
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const id = (req.body ?? {}).id;
          if (typeof id !== "string" || !/^[A-Za-z0-9]{1,40}$/.test(id)) {
            res.status(400).json({ error: "bad_request" });
            return;
          }
          const ok = await store.setCommentStatus(id, status);
          res.status(ok ? 200 : 404).json(ok ? { ok: true } : { error: "not_found" });
        } catch (err) {
          next(err);
        }
      };

    admin.post("/comments/remove", statusRoute("removed"));
    admin.post("/comments/restore", statusRoute("visible"));

    admin.post("/comments/purge", async (req, res, next) => {
      try {
        const id = (req.body ?? {}).id;
        if (typeof id !== "string" || !/^[A-Za-z0-9]{1,40}$/.test(id)) {
          res.status(400).json({ error: "bad_request" });
          return;
        }
        const ok = await store.purgeComment(id);
        res.status(ok ? 200 : 404).json(ok ? { ok: true } : { error: "not_found" });
      } catch (err) {
        next(err);
      }
    });

    app.use("/api/admin", admin);
  }

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
