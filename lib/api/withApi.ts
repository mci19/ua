import { NextResponse } from "next/server";
import { ApiError, dutchMessageForError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

type RouteContext<Params = Record<string, string>> = { params: Promise<Params> };

type Handler<Params> = (
  req: Request,
  ctx: RouteContext<Params>,
) => Promise<NextResponse | Response> | NextResponse | Response;

export function withApi<Params = Record<string, string>>(
  handler: Handler<Params>,
): Handler<Params> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("API error", { status: err.status, code: err.code, msg: err.message });
        return NextResponse.json(
          { ok: false, error: { code: err.code, message: dutchMessageForError(err) } },
          { status: err.status },
        );
      }
      logger.error("Unhandled API error", { err: String(err) });
      return NextResponse.json(
        { ok: false, error: { code: "internal", message: dutchMessageForError(err) } },
        { status: 500 },
      );
    }
  };
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}
