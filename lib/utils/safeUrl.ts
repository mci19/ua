// Whitelist for redirect targets. Prevents open-redirect attacks via
// ?callbackUrl=https://evil.example.org on /login or ?returnTo=... on
// the SISA-grant page. Only same-origin / relative paths are returned;
// everything else falls back to "/".
//
// Strict rules: a value is safe iff
//  - it's a string
//  - it starts with a single "/" (so not "//evil.com")
//  - it does not contain a backslash (some browsers normalise "\" → "/")
//  - it does not contain control characters
//  - it is not a scheme-prefixed absolute URL ("https://...", "javascript:")
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(raw)) return fallback;
  return raw;
}
