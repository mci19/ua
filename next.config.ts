import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

// Netlify's Next.js runtime handles SSR/middleware on its own and is
// incompatible with the standalone output. Keep standalone for Docker / Azure
// deploys, disable it on Netlify (where NETLIFY=true in the build env).
const isNetlify = !!process.env.NETLIFY;

// Content-Security-Policy: locks the page down so the only third-party
// origins the browser will talk to are Microsoft (login + Graph) and
// the SharePoint document hosts. Inline scripts are forbidden, except
// where Next.js itself needs them (handled via the `unsafe-inline`
// fallback for `script-src`; tighter values require nonces which we
// don't yet wire through).
// `unsafe-inline` is kept for now because Next.js 15 ships hydration boot
// scripts inline; replacing it requires per-request nonces wired through
// middleware. `unsafe-eval` has been dropped — UA-IT review flags it,
// and Next 15 + React 19 do not require it at runtime. `wasm-unsafe-eval`
// allows the small WASM modules that some optional libs ship without
// re-opening the door to general eval.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.sharepoint.com https://graph.microsoft.com",
  "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://*.dynamics.com https://*.sharepoint.com",
  "frame-src 'self' https://login.microsoftonline.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://login.microsoftonline.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const config: NextConfig = {
  output: isNetlify ? undefined : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "26mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.sharepoint.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(config);
