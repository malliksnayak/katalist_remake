import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Disable image optimization since standard static export doesn't support the default Next.js image loader
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
