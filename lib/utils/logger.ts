type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function envLevel(): number {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase() as Level;
  return LEVELS[raw] ?? LEVELS.info;
}

// Strip out personally-identifiable / sensitive substrings before logging.
// Dataverse query URLs contain emails inside `tolower(...) eq 'x'` filters and
// GUIDs of records. We do best-effort masking; not a perfect anonymiser but
// catches the obvious leaks (email addresses, NRN-like 11-digit sequences,
// access tokens passed in headers).
const PATTERNS: { re: RegExp; replacement: string }[] = [
  { re: /([\w._%+-]+)@([\w.-]+\.[A-Za-z]{2,})/g, replacement: "[email]" },
  { re: /\b\d{11}\b/g, replacement: "[nrn]" },
  {
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    replacement: "[guid]",
  },
  { re: /(Bearer\s+)[A-Za-z0-9._-]+/gi, replacement: "$1[token]" },
];

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    let out = value;
    for (const { re, replacement } of PATTERNS) out = out.replace(re, replacement);
    return out;
  }
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) result[k] = redact(v);
  return result;
}

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < envLevel()) return;
  const line = {
    level,
    msg: redact(msg),
    t: new Date().toISOString(),
    ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
  };
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(line));
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
};
