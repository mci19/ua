import { LRUCache } from "lru-cache";
import { getConfidentialClient } from "@/lib/auth/msal";
import { isDemoMode } from "@/lib/demo/flag";
import { ApiError } from "@/lib/utils/errors";

interface CacheEntry {
  token: string;
  expiresAt: number; // seconds since epoch
}

// LRU keeps memory bounded under heavy load: at most 10k entries, each
// auto-expires 5 min before Microsoft's default 60-min access-token TTL.
const cache = new LRUCache<string, CacheEntry>({
  max: 10_000,
  ttl: 1000 * 60 * 55,
});

function key(oid: string, scope: string) {
  return `${oid}::${scope}`;
}

// Dataverse: we authorize as the Application User (S2S, client_credentials)
// rather than on behalf of the student. This sidesteps the per-user
// Power Apps Premium licence requirement that delegated/OBO would trigger:
// students keep their M365-only licence and never need their own Dataverse
// entitlement. Authorization ("can this student see this dossier?") is
// enforced *in our code* (see assertOwnership in the API routes) by
// matching session.user.email against the contact record, not by Dataverse
// row-level security.
//
// Graph keeps OBO (Files.ReadWrite / Sites.ReadWrite are included in M365
// A3/A5) so SharePoint audit-trails still show the student as the uploader.
async function acquireAppOnly(scopes: string[]): Promise<string> {
  if (isDemoMode) return "demo-token";
  const k = `app-only::${scopes.join(" ")}`;
  const hit = cache.get(k);
  const now = Date.now() / 1000;
  if (hit && hit.expiresAt - 60 > now) return hit.token;

  const client = getConfidentialClient();
  const result = await client.acquireTokenByClientCredential({ scopes });
  if (!result?.accessToken || !result.expiresOn) {
    throw new ApiError(500, "Failed to acquire Dataverse app-only token", {
      dutchMessage: "De portal kan momenteel niet bij de databank.",
    });
  }
  cache.set(k, {
    token: result.accessToken,
    expiresAt: result.expiresOn.getTime() / 1000,
  });
  return result.accessToken;
}

async function exchangeOnBehalfOf(
  oid: string,
  userAssertion: string,
  scopes: string[],
): Promise<string> {
  if (isDemoMode) return "demo-token";
  const k = key(oid, scopes.join(" "));
  const hit = cache.get(k);
  const now = Date.now() / 1000;
  if (hit && hit.expiresAt - 60 > now) return hit.token;

  const client = getConfidentialClient();
  const result = await client.acquireTokenOnBehalfOf({
    oboAssertion: userAssertion,
    scopes,
  });
  if (!result?.accessToken || !result.expiresOn) {
    throw new ApiError(401, "OBO token exchange returned no token", {
      dutchMessage: "Je sessie is verlopen. Meld je opnieuw aan.",
    });
  }
  cache.set(k, {
    token: result.accessToken,
    expiresAt: result.expiresOn.getTime() / 1000,
  });
  return result.accessToken;
}

function dataverseScope(): string {
  const base = required("DATAVERSE_URL").replace(/\/$/, "");
  return `${base}/.default`;
}

// Note: signature keeps the old (oid, userAssertion) for callers that still
// thread the auth context through, but ignores them — Dataverse access is
// now app-only. Once all callers migrate to `dataverseToken()` we can drop
// the legacy signature.
export function exchangeForDataverseToken(_oid: string, _userAssertion: string) {
  return dataverseToken();
}

export function dataverseToken(): Promise<string> {
  if (isDemoMode) return Promise.resolve("demo-token");
  return acquireAppOnly([dataverseScope()]);
}

export function exchangeForGraphToken(oid: string, userAssertion: string) {
  if (isDemoMode) return Promise.resolve("demo-token");
  return exchangeOnBehalfOf(oid, userAssertion, [
    "https://graph.microsoft.com/Files.ReadWrite.All",
    "https://graph.microsoft.com/Sites.ReadWrite.All",
  ]);
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new ApiError(500, `Missing env var: ${key}`);
  return v;
}
