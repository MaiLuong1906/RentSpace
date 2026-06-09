import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bắt buộc để Docker Dockerfile chạy đúng (dùng server.js standalone mode)
  output: "standalone",

  // Cho phép tải hình ảnh từ AWS S3 và Unsplash
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
