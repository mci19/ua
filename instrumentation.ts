// Runs once when the Next.js server boots. Use it to normalise env vars that
// NextAuth reads at module-load time, so a slightly malformed value (e.g. a
// hostname without scheme) doesn't crash the whole app.
export async function register() {
  for (const key of ["NEXTAUTH_URL", "AUTH_URL"] as const) {
    const raw = process.env[key];
    if (!raw) continue;
    const trimmed = raw.trim().replace(/\/$/, "");
    if (!trimmed) {
      delete process.env[key];
      continue;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[instrumentation] ${key}="${raw}" is missing a scheme; assuming https://`,
      );
      process.env[key] = `https://${trimmed}`;
    } else {
      process.env[key] = trimmed;
    }
  }
}
