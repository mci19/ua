import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import { isDemoMode } from "@/lib/demo/flag";

let cached: ConfidentialClientApplication | null = null;

export function getConfidentialClient(): ConfidentialClientApplication {
  if (isDemoMode) {
    throw new Error("MSAL client is not available in demo mode");
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
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}
