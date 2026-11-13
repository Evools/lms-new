import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["./storage/**/*"],
  },
};

export default nextConfig;
