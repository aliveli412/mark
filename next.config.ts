import type { NextConfig } from "next";
import { provinces } from "./lib/site";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Local / reverse-proxy Server Action CSRF allowlist (exact hosts only).
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    // Live-style short paths stay on this portal: /belgium → /districts/belgium
    const districtRedirects = provinces.map((province) => ({
      source: `/${province.slug}`,
      destination: `/districts/${province.slug}`,
      permanent: false,
    }));
    return [
      { source: "/blog", destination: "/news", permanent: false },
      { source: "/blog/:slug", destination: "/news/:slug", permanent: false },
      ...districtRedirects,
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.basemaps.cartocdn.com https://*.openstreetmap.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
