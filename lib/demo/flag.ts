// Set UA_DEMO_MODE=true to bypass Microsoft Entra ID + Dataverse + SharePoint
// and run everything against in-memory mock data. Useful for screenshots,
// demos, and PR previews where Azure isn't available.
export const isDemoMode = process.env.UA_DEMO_MODE === "true";

export const DEMO_BANNER_TEXT =
  "DEMO MODUS — data is fictief en wordt niet opgeslagen. Niet voor productie.";
