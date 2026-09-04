import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/admin",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/admin",
        destination: "/admin/login",
      },
    ];
  },
};

export default nextConfig;