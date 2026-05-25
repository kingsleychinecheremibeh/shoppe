import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
});

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").trim();
const apiOrigin = new URL(apiUrl).origin;
const apiImagesHost = new URL(apiOrigin);

const nextConfig: NextConfig = {
  turbopack: {},
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
        hostname: "img.staticdj.com",
      },
      {
        protocol: "https",
        hostname: "tailwindui.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
