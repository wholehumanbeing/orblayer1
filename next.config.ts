import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  output: 'export',
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
