import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ApiError, dutchMessageForError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/observability/sentry";

type RouteContext<Params = Record<string, string>> = { params: Promise<Params> };

type Handler<Params> = (
  req: Request,
  ctx: RouteContext<Params>,
) => Promise<NextResponse | Response> | NextResponse | Response;

// Lightweight in-process circuit breaker: if 5 server-error responses fire
// from Dataverse/Graph inside a 60s window, the next minute of requests
// short-circuits to 503 with a Dutch message. Auto-heals after a successful
// call. Per-instance only — fine on Netlify Functions because each cold
// instance maintains its own counter, and 503-spikes won't pile up across
// instances.
const BREAKER_THRESHOLD = 5;
const BREAKER_WINDOW_MS = 60_000;
const BREAKER_COOLDOWN_MS = 60_000;
interface BreakerState {
  failures: number[]; // timestamps within the rolling window
  openedAt: number | null;
}
const breaker: BreakerState = { failures: [], openedAt: null };

function recordFailure() {
  const now = Date.now();
  breaker.failures = breaker.failures.filter((t) => now - t < BREAKER_WINDOW_MS);
  breaker.failures.push(now);
  if (breaker.failures.length >= BREAKER_THRESHOLD && !breaker.openedAt) {
    breaker.openedAt = now;
    logger.warn("Circuit breaker opened", { failures: breaker.failures.length });
  }
}

function recordSuccess() {
  if (breaker.openedAt) {
    breaker.openedAt = null;
    breaker.failures = [];
    logger.info("Circuit breaker closed", {});
  }
}

function breakerOpen(): boolean {
  if (!breaker.openedAt) return false;
  if (Date.now() - breaker.openedAt > BREAKER_COOLDOWN_MS) {
    // Half-open: allow the next call through to probe.
    breaker.openedAt = null;
    return false;
  }
  return true;
}

export function withApi<Params = Record<string, string>>(
  handler: Handler<Params>,
): Handler<Params> {
  return async (req, ctx) => {
    const traceId = req.headers.get("x-request-id") ?? randomUUID();
    if (breakerOpen()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "service_unavailable",
            message:
              "Onze backend is tijdelijk niet bereikbaar. Probeer het over enkele minuten opnieuw.",
          },
        },
        { status: 503, headers: { "Retry-After": "60", "x-request-id": traceId } },
      );
    }
    try {
      const res = await handler(req, ctx);
      // Mirror the trace id back so we can correlate browser-side errors
      // with server logs.
      try {
        res.headers.set("x-request-id", traceId);
      } catch {
        // Some Response subclasses freeze headers; non-fatal.
      }
      recordSuccess();
      return res;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status >= 500) recordFailure();
        else recordSuccess();
        logger.warn("API error", {
          status: err.status,
          code: err.code,
          msg: err.message,
          traceId,
        });
        return NextResponse.json(
          { ok: false, error: { code: err.code, message: dutchMessageForError(err) } },
          { status: err.status, headers: { "x-request-id": traceId } },
        );
      }
      recordFailure();
      logger.error("Unhandled API error", { err: String(err), traceId });
      captureError(err, { traceId, path: new URL(req.url).pathname });
      return NextResponse.json(
        { ok: false, error: { code: "internal", message: dutchMessageForError(err) } },
        { status: 500, headers: { "x-request-id": traceId } },
      );
    }
  };
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}
