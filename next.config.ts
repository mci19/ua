import type { NextConfig } from "next";

// Netlify's Next.js runtime handles SSR/middleware on its own and is
// incompatible with the standalone output. Keep standalone for Docker / Azure
// deploys, disable it on Netlify (where NETLIFY=true in the build env).
const isNetlify = !!process.env.NETLIFY;

const config: NextConfig = {
  output: isNetlify ? undefined : "standalone",
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "26mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.sharepoint.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
};

export default config;
