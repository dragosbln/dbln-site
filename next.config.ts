import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` emits plain HTML/CSS/JS into `out/`,
  // served directly by Firebase Hosting (no Cloud Functions).
  output: "export",
  // Static export has no image optimization server.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
