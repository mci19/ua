// Thin wrapper around @sentry/nextjs so the rest of the codebase can call
// `captureError(err, meta)` without crashing when Sentry isn't installed
// (e.g. local dev, demo deploys). The dynamic import is loaded once at
// boot via instrumentation.ts and cached here.
//
// To enable: `pnpm add @sentry/nextjs` + set `SENTRY_DSN` in env. With
// nothing installed/configured every helper short-circuits to no-op.

type CaptureMeta = Record<string, unknown>;

interface SentryLike {
  captureException(err: unknown, ctx?: { extra?: CaptureMeta }): void;
  captureMessage(msg: string, ctx?: { level?: "warning" | "error"; extra?: CaptureMeta }): void;
}

let sentry: SentryLike | null = null;

export async function initSentry(): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import("@sentry/nextjs" as string).catch(() => null);
    if (!mod?.init) return;
    mod.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
      // PII filter: we already redact in our logger, but Sentry's auto-
      // capture (request headers, breadcrumbs) needs its own pass.
      beforeSend(event: Record<string, unknown>) {
        return scrubEvent(event);
      },
    });
    sentry = mod as SentryLike;
  } catch {
    // Swallow — Sentry being unavailable must never break the app.
  }
}

export function captureError(err: unknown, meta?: CaptureMeta): void {
  sentry?.captureException(err, { extra: meta });
}

export function captureMessage(msg: string, meta?: CaptureMeta): void {
  sentry?.captureMessage(msg, { level: "warning", extra: meta });
}

function scrubEvent(event: Record<string, unknown>): Record<string, unknown> {
  // Strip Authorization, Cookie, query params with email-shaped values.
  const req = event.request as
    | { headers?: Record<string, string>; query_string?: string }
    | undefined;
  if (req?.headers) {
    delete req.headers.authorization;
    delete req.headers.cookie;
  }
  if (req?.query_string) {
    req.query_string = req.query_string.replace(
      /([\w._%+-]+@[\w.-]+\.[A-Za-z]{2,})/g,
      "[email]",
    );
  }
  return event;
}
