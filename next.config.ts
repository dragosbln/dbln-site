import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` emits plain HTML/CSS/JS into `out/`,
  // served directly by Firebase Hosting (no Cloud Functions).
  output: "export",
  // Static export has no image optimization server.
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Pin the root so a stray lockfile in a parent directory can't shift
    // module resolution (breaks the dev server with RSC manifest errors).
    root: __dirname,
  },
};

export default nextConfig;
