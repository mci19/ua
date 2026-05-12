import { isDemoMode } from "@/lib/demo/flag";

// Public diagnostic endpoint. Returns nothing sensitive — just a yes/no on
// each env-var so you can verify the deploy is configured the way you think
// it is. Visit /api/health from the browser.
export const dynamic = "force-dynamic";

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

export async function GET() {
  const has = (k: string) => !!process.env[k] && process.env[k] !== "";
  const nextauthUrl = parseUrl(process.env.NEXTAUTH_URL);
  const authUrl = parseUrl(process.env.AUTH_URL);
  return Response.json(
    {
      ok: true,
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
      hint: isDemoMode
        ? "Demo mode is active. Log in at /login with anna/tom/lara, password 'demo'."
        : "Production mode. Make sure all Azure/Dataverse vars are set, or set UA_DEMO_MODE=true to enable the in-memory demo.",
    },
    { status: 200 },
  );
}
