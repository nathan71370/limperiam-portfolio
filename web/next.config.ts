import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: true,
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.API_URL || "http://api:8000"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
