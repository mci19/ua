export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

export class ClientApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Server contract: every API route returns `{ ok: boolean, data?: T,
// error?: { ... } }`. apiFetch validates that envelope at runtime so a
// misbehaving server doesn't slip through as a "T" cast and crash the
// client renderer with a cryptic property-access error.
function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "ok" in value;
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // ignore parse errors; we'll throw a generic error below
  }

  const body = isEnvelope<T>(parsed) ? parsed : null;

  if (!res.ok || !body?.ok) {
    throw new ClientApiError(
      res.status,
      body?.error?.message ?? "Er ging iets mis.",
      body?.error?.code,
    );
  }
  if (body.data === undefined) {
    // Server sent ok:true without payload — most code paths expect a
    // value back; surface the inconsistency rather than returning
    // undefined-as-T.
    throw new ClientApiError(500, "Server returned no data");
  }
  return body.data;
}
