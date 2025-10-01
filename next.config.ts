import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['f003.backblazeb2.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
