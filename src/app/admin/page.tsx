import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

/**
 * Owner moderation panel. Deliberately NOT in the sitemap, llms.txt or any
 * nav (the "Adding a page" recipe is skipped on purpose — this page must
 * not be discoverable), noindexed here and disallowed in robots.ts. The
 * static HTML contains only the sign-in gate; data exists solely behind
 * the allowlisted admin API.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main">
      <div className="wrap">
        <AdminPanel />
      </div>
    </main>
  );
}
