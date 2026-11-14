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
    // Live-site style country paths: /belgium → published district Mark Site.
    return provinces.map((province) => ({
      source: `/${province.slug}`,
      destination: province.liveUrl,
      permanent: false,
    }));
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
