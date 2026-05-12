import { isDemoMode } from "@/lib/demo/flag";

// Public diagnostic endpoint. Returns nothing sensitive — just a yes/no on
// each env-var so you can verify the deploy is configured the way you think
// it is. Visit /api/health from the browser.
//
// When `?deep=1` is passed AND credentials are configured, we also issue a
// non-auth (=client_credentials) ping to Dataverse `WhoAmI`. The result is
// cached for 30s in-process so the monitor doesn't burn Dataverse quota.
export const dynamic = "force-dynamic";

interface DeepCheck {
  dataverse?: { ok: boolean; status?: number; latencyMs?: number };
  graph?: { ok: boolean; status?: number; latencyMs?: number };
}

let deepCache: { at: number; result: DeepCheck } | null = null;
const DEEP_CACHE_TTL_MS = 30_000;

async function clientCredsToken(scope: string): Promise<string | null> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      { method: "POST", body: form.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctl.signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string };
    return data.access_token ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function pingDataverse(): Promise<DeepCheck["dataverse"]> {
  const url = process.env.DATAVERSE_URL;
  if (!url) return { ok: false, status: 0 };
  const token = await clientCredsToken(`${url.replace(/\/$/, "")}/.default`);
  if (!token) return { ok: false, status: 0 };
  const start = Date.now();
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/data/v9.2/WhoAmI`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: ctl.signal,
    });
    return { ok: res.ok, status: res.status, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, status: 0, latencyMs: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

async function pingGraph(): Promise<DeepCheck["graph"]> {
  const token = await clientCredsToken("https://graph.microsoft.com/.default");
  if (!token) return { ok: false, status: 0 };
  const start = Date.now();
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    // /me requires a delegated token; for service-principal we use /v1.0/$metadata
    // which only needs an application token and proves connectivity.
    const res = await fetch("https://graph.microsoft.com/v1.0/$metadata", {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctl.signal,
    });
    return { ok: res.ok, status: res.status, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, status: 0, latencyMs: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

async function runDeepCheck(): Promise<DeepCheck> {
  if (deepCache && Date.now() - deepCache.at < DEEP_CACHE_TTL_MS) {
    return deepCache.result;
  }
  const [dataverse, graph] = await Promise.all([pingDataverse(), pingGraph()]);
  const result: DeepCheck = { dataverse, graph };
  deepCache = { at: Date.now(), result };
  return result;
}

function parseUrl(raw?: string) {
  if (!raw) return { set: false };
  try {
    const url = new URL(raw);
    return {
      set: true,
      value: url.toString().replace(/\/$/, ""),
      ok: true,
      protocol: url.protocol,
    };
  } catch {
    return {
      set: true,
      value: raw,
      ok: false,
      error:
        "Invalid URL — moet beginnen met https:// (bv. https://ua-poc.netlify.app).",
    };
  }
}

export async function GET(req: Request) {
  const has = (k: string) => !!process.env[k] && process.env[k] !== "";
  const nextauthUrl = parseUrl(process.env.NEXTAUTH_URL);
  const authUrl = parseUrl(process.env.AUTH_URL);
  const url = new URL(req.url);
  const deep =
    !isDemoMode && (url.searchParams.get("deep") === "1" || url.searchParams.get("deep") === "true");
  const deepCheck = deep ? await runDeepCheck() : undefined;
  const downstreamOk =
    !deepCheck ||
    (deepCheck.dataverse?.ok !== false && deepCheck.graph?.ok !== false);
  return Response.json(
    {
      ok: downstreamOk,
      mode: isDemoMode ? "demo" : "production",
      env: {
        UA_DEMO_MODE: process.env.UA_DEMO_MODE ?? "(unset)",
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: process.env.NETLIFY ?? "(unset)",
      },
      authConfigured: {
        AUTH_SECRET: has("AUTH_SECRET"),
        NEXTAUTH_URL: nextauthUrl,
        AUTH_URL: authUrl,
      },
      azureConfigured: isDemoMode
        ? "skipped in demo mode"
        : {
            AZURE_AD_TENANT_ID: has("AZURE_AD_TENANT_ID"),
            AZURE_AD_CLIENT_ID: has("AZURE_AD_CLIENT_ID"),
            AZURE_AD_CLIENT_SECRET: has("AZURE_AD_CLIENT_SECRET"),
            DATAVERSE_URL: has("DATAVERSE_URL"),
            SHAREPOINT_SITE_ID: has("SHAREPOINT_SITE_ID"),
            SHAREPOINT_DRIVE_ID: has("SHAREPOINT_DRIVE_ID"),
          },
      downstream: deepCheck,
      hint: isDemoMode
        ? "Demo mode is active. Log in at /login with anna/tom/lara, password 'demo'."
        : "Production mode. Add ?deep=1 to test connectivity to Dataverse + Graph (results cached 30s).",
    },
    { status: downstreamOk ? 200 : 503 },
  );
}
