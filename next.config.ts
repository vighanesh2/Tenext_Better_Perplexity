import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack filesystem cache to avoid "Failed to open database" /
    // "invalid digit found in string" errors (can occur with special chars in path)
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
