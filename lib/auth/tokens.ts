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

export function exchangeForDataverseToken(oid: string, userAssertion: string) {
  if (isDemoMode) return Promise.resolve("demo-token");
  return exchangeOnBehalfOf(oid, userAssertion, [dataverseScope()]);
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
