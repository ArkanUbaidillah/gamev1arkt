import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /phaser/,
      type: "javascript/auto",
    });
    return config;
  },
};

export default nextConfig;
