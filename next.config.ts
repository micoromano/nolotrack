import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build Docker/self-hosting: server Node autonomo in .next/standalone
  // (attivato dal Dockerfile con BUILD_STANDALONE=1; su Vercel resta il default).
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
