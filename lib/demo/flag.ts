// Set UA_DEMO_MODE=true (or 1/yes/on) to bypass Microsoft Entra ID + Dataverse
// + SharePoint and run everything against in-memory mock data. Useful for
// screenshots, demos, and PR previews where Azure isn't available.
//
// Hard guard: in NODE_ENV=production we refuse demo mode unless the explicit
// UA_ALLOW_DEMO_IN_PROD flag is also set. This prevents an accidentally-set
// UA_DEMO_MODE from collapsing production auth to a hardcoded test password.

const TRUTHY = new Set(["true", "1", "yes", "on", "y"]);

function truthy(value: unknown): boolean {
  return TRUTHY.has(String(value ?? "").trim().toLowerCase());
}

function readDemoMode(): boolean {
  const wantsDemo = truthy(process.env.UA_DEMO_MODE);
  if (!wantsDemo) return false;
  if (process.env.NODE_ENV === "production") {
    const allowed = truthy(process.env.UA_ALLOW_DEMO_IN_PROD);
    if (!allowed) {
      // eslint-disable-next-line no-console
      console.warn(
        "[demo] UA_DEMO_MODE=true in production is ignored. Set UA_ALLOW_DEMO_IN_PROD=true to opt in (e.g. preview deploys).",
      );
      return false;
    }
  }
  return true;
}

export const isDemoMode = readDemoMode();

export const DEMO_BANNER_TEXT =
  "DEMO MODUS — data is fictief en wordt niet opgeslagen. Niet voor productie.";
