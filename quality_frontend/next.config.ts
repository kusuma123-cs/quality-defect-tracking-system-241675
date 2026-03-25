import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * This app relies on dynamic routes (/defects/[id]) backed by live API data.
   * Static export requires precomputing all params at build-time, which is not feasible here.
   */
};

export default nextConfig;
