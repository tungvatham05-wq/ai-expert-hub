import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "faculty.wharton.upenn.edu",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
