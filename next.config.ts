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
      // Ảnh Wikipedia — ổn định, dùng cho các chuyên gia không có GitHub
      // (Demis Hassabis, Dario Amodei, Andrew Ng, Jim Fan...)
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      // Ảnh profile X/Twitter (pbs = photo blob storage)
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
      // Ảnh avatar kênh YouTube (yt3.ggpht.com / yt3.googleusercontent.com)
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
