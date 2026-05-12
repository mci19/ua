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

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new ApiError(500, `Missing env var: ${key}`);
  return v;
}
