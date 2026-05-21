import type { NextConfig } from "next";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").trim();
const fallbackApiOrigin = "https://shoppe-backend-yko6.onrender.com";
const apiOrigin = apiUrl.startsWith("http") ? new URL(apiUrl).origin : fallbackApiOrigin;
const apiImagesHost = new URL(apiOrigin);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://shoppe-backend-yko6.onrender.com/api/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: apiImagesHost.protocol.replace(":", "") as "http" | "https",
        hostname: apiImagesHost.hostname,
        port: apiImagesHost.port,
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "tailwindui.com",
      },
    ],
  },
};

export default nextConfig;
