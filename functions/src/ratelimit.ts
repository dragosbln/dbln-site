/**
 * Sliding-window rate limiter, memory-only by design: keys (IPs, subject
 * ids) must never be persisted — the /privacy page says so. Instance
 * restarts reset it; that's an accepted trade for storing nothing. This
 * blocks casual abuse, not a determined attacker — the admin panel and
 * append-only records are the real backstop.
 */
export class SlidingWindow {
  private hits = new Map<string, number[]>();

  constructor(
    private limit: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}

  /** Records a hit; returns false when the key is over the limit. */
  hit(key: string): boolean {
    const t = this.now();
    const cutoff = t - this.windowMs;
    const times = (this.hits.get(key) ?? []).filter((x) => x > cutoff);
    if (times.length >= this.limit) {
      this.hits.set(key, times);
      return false;
    }
    times.push(t);
    this.hits.set(key, times);
    if (this.hits.size > 5000) this.prune(cutoff);
    return true;
  }

  private prune(cutoff: number) {
    for (const [key, times] of this.hits) {
      const kept = times.filter((x) => x > cutoff);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }
}
