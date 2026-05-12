import { isDemoMode } from "@/lib/demo/flag";

// Allow debug routes only outside production, or when the explicit
// demo-allow-in-prod flag is set. Production deploys should never
// expose user-data dumps.
export function isDebugEndpointAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return isDemoMode;
}

export function debugNotFound(): Response {
  return new Response("Not found", { status: 404 });
}
