// Runs once when the Next.js server boots. We deliberately do NOT
// silently auto-fix obviously-malformed env vars — we *warn* but leave
// the value untouched in production, so the operator notices it. In
// development we still patch missing schemes to keep local DX smooth.
export async function register() {
  const isProd = process.env.NODE_ENV === "production";

  for (const key of ["NEXTAUTH_URL", "AUTH_URL"] as const) {
    const raw = process.env[key];
    if (!raw) continue;
    const trimmed = raw.trim().replace(/\/$/, "");
    if (!trimmed) {
      // eslint-disable-next-line no-console
      console.warn(`[instrumentation] ${key} is empty; removing it.`);
      delete process.env[key];
      continue;
    }
    const hasScheme = /^https?:\/\//i.test(trimmed);
    if (!hasScheme) {
      if (isProd) {
        // eslint-disable-next-line no-console
        console.warn(
          `[instrumentation] ${key}="${raw}" is missing a scheme. NextAuth will likely throw "Invalid URL". Set it to "https://<host>" explicitly. Not auto-patching in production.`,
        );
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[instrumentation] ${key}="${raw}" missing a scheme; auto-patching to "https://${trimmed}" for development.`,
        );
        process.env[key] = `https://${trimmed}`;
      }
      continue;
    }
    process.env[key] = trimmed;
  }
}
