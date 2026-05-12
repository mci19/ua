import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import { isDemoMode } from "@/lib/demo/flag";
import { ApiError } from "@/lib/utils/errors";

let cached: ConfidentialClientApplication | null = null;

// In demo mode this constructor is never invoked, so the @azure/msal-node
// import is fine. If you want to drop the dependency entirely from the
// demo bundle later, swap the import for a dynamic `await import(...)`.
export function getConfidentialClient(): ConfidentialClientApplication {
  if (isDemoMode) {
    throw new ApiError(500, "MSAL client is not available in demo mode");
  }
  if (cached) return cached;
  const tenantId = required("AZURE_AD_TENANT_ID");
  const clientId = required("AZURE_AD_CLIENT_ID");
  const clientSecret = required("AZURE_AD_CLIENT_SECRET");

  cached = new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
        loggerCallback: (_level, message) => {
          if (process.env.LOG_LEVEL === "debug") console.log(message);
        },
      },
    },
  });
  return cached;
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new ApiError(500, `Missing env var: ${key}`);
  return v;
}
