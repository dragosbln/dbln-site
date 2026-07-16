"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/**
 * Interactive leaf that boots Plausible after hydration. Renders nothing —
 * it exists so the root layout stays a server component. The hostname gate
 * and the no-cookie constraint live in `src/lib/analytics.ts`.
 */
export default function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
