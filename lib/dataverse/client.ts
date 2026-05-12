import { ApiError, toApiErrorFromDataverse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type { DataverseListResponse } from "@/lib/dataverse/types";

export interface ODataQuery {
  $select?: string;
  $filter?: string;
  $expand?: string;
  $orderby?: string;
  $top?: number;
  $count?: boolean;
}

export interface DataverseClient {
  list<T>(entitySet: string, q?: ODataQuery): Promise<T[]>;
  // listAll follows @odata.nextLink until exhausted. Use only when the
  // result set is unbounded (e.g. a power-user's request history). Most
  // callers should stick to `list` + `$top`.
  listAll<T>(entitySet: string, q?: ODataQuery, maxPages?: number): Promise<T[]>;
  get<T>(entitySet: string, id: string, q?: ODataQuery): Promise<T>;
  create<T>(entitySet: string, body: Record<string, unknown>): Promise<T>;
  update(entitySet: string, id: string, body: Record<string, unknown>): Promise<void>;
  delete(entitySet: string, id: string): Promise<void>;
}

const ODATA_HEADERS = {
  "OData-MaxVersion": "4.0",
  "OData-Version": "4.0",
  Accept: "application/json",
  "Content-Type": "application/json",
};

export function createDataverseClient(token: string): DataverseClient {
  const base = `${requireEnv("DATAVERSE_URL").replace(/\/$/, "")}/api/data/v9.2`;
  const baseHeaders = {
    ...ODATA_HEADERS,
    Authorization: `Bearer ${token}`,
    Prefer: 'odata.include-annotations="*"',
  };

  return {
    async list<T>(entitySet: string, q?: ODataQuery) {
      const url = `${base}/${entitySet}${buildQs(q)}`;
      const res = await retryFetch(url, { headers: baseHeaders });
      if (!res.ok) throw await toApiErrorFromDataverse(res);
      const body = (await res.json()) as DataverseListResponse<T>;
      return body.value;
    },
    async listAll<T>(entitySet: string, q?: ODataQuery, maxPages = 20) {
      const out: T[] = [];
      let url: string | undefined = `${base}/${entitySet}${buildQs(q)}`;
      let page = 0;
      while (url && page < maxPages) {
        const res = await retryFetch(url, { headers: baseHeaders });
        if (!res.ok) throw await toApiErrorFromDataverse(res);
        const body = (await res.json()) as DataverseListResponse<T>;
        out.push(...body.value);
        url = body["@odata.nextLink"];
        page += 1;
      }
      return out;
    },
    async get<T>(entitySet: string, id: string, q?: ODataQuery) {
      const url = `${base}/${entitySet}(${id})${buildQs(q)}`;
      const res = await retryFetch(url, { headers: baseHeaders });
      if (!res.ok) throw await toApiErrorFromDataverse(res);
      return (await res.json()) as T;
    },
    async create<T>(entitySet: string, body: Record<string, unknown>) {
      const url = `${base}/${entitySet}`;
      const res = await retryFetch(url, {
        method: "POST",
        headers: { ...baseHeaders, Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await toApiErrorFromDataverse(res);
      return (await res.json()) as T;
    },
    async update(entitySet: string, id: string, body: Record<string, unknown>) {
      const url = `${base}/${entitySet}(${id})`;
      const res = await retryFetch(url, {
        method: "PATCH",
        headers: { ...baseHeaders, "If-Match": "*" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await toApiErrorFromDataverse(res);
    },
    async delete(entitySet: string, id: string) {
      const url = `${base}/${entitySet}(${id})`;
      const res = await retryFetch(url, {
        method: "DELETE",
        headers: baseHeaders,
      });
      if (!res.ok) throw await toApiErrorFromDataverse(res);
    },
  };
}

function buildQs(q?: ODataQuery): string {
  if (!q) return "";
  const parts: string[] = [];
  if (q.$select) parts.push(`$select=${encodeURIComponent(q.$select)}`);
  if (q.$filter) parts.push(`$filter=${encodeURIComponent(q.$filter)}`);
  if (q.$expand) parts.push(`$expand=${encodeURIComponent(q.$expand)}`);
  if (q.$orderby) parts.push(`$orderby=${encodeURIComponent(q.$orderby)}`);
  if (q.$top) parts.push(`$top=${q.$top}`);
  if (q.$count) parts.push(`$count=true`);
  return parts.length ? `?${parts.join("&")}` : "";
}

async function retryFetch(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 2 ** attempt;
    logger.warn("Dataverse 429, retrying", { url, retryAfter });
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return retryFetch(url, init, attempt + 1);
  }
  return res;
}

export function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}

// Guards against OData injection in $filter clauses: every Dataverse GUID
// interpolated into a `_value eq ${id}` or `(${id})` segment MUST first
// pass assertGuid. A caller-supplied "abc' or 1 eq 1" would otherwise
// leak data across tenants.
const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Demo mode uses synthetic ids like "contact-anna" / "req-demo-101"
// instead of GUIDs; allow that shape only when isDemoMode is true.
const DEMO_ID_RE = /^[a-z0-9-]{1,64}$/i;

export function assertGuid(id: string, name = "id"): string {
  if (!id || typeof id !== "string") {
    throw new ApiError(400, `Invalid ${name}`, {
      dutchMessage: "Ongeldige aanvraag.",
    });
  }
  if (GUID_RE.test(id)) return id;
  // Cheap escape hatch for demo mode (no real Dataverse), enabled when
  // UA_DEMO_MODE=true and the id matches a safe character class.
  const truthy = (v?: string) =>
    typeof v === "string" && ["true", "1", "yes"].includes(v.toLowerCase());
  if (truthy(process.env.UA_DEMO_MODE) && DEMO_ID_RE.test(id)) return id;
  throw new ApiError(400, `Invalid ${name}: not a GUID`, {
    dutchMessage: "Ongeldige aanvraag.",
  });
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new ApiError(500, `Missing env var: ${key}`);
  return v;
}
