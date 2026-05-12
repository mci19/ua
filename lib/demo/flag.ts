// Set UA_DEMO_MODE=true (or 1/yes/on) to bypass Microsoft Entra ID + Dataverse
// + SharePoint and run everything against in-memory mock data. Useful for
// screenshots, demos, and PR previews where Azure isn't available.
const TRUTHY = new Set(["true", "1", "yes", "on", "y"]);

function readDemoMode(): boolean {
  const raw = String(process.env.UA_DEMO_MODE ?? "").trim().toLowerCase();
  return TRUTHY.has(raw);
}

export const isDemoMode = readDemoMode();

export const DEMO_BANNER_TEXT =
  "DEMO MODUS — data is fictief en wordt niet opgeslagen. Niet voor productie.";
