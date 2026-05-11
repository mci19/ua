import { getConfidentialClient } from "@/lib/auth/msal";

interface CacheEntry {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function key(oid: string, scope: string) {
  return `${oid}::${scope}`;
}

async function exchangeOnBehalfOf(
  oid: string,
  userAssertion: string,
  scopes: string[],
): Promise<string> {
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
    throw new Error("OBO token exchange returned no token");
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
  return exchangeOnBehalfOf(oid, userAssertion, [dataverseScope()]);
}

export function exchangeForGraphToken(oid: string, userAssertion: string) {
  return exchangeOnBehalfOf(oid, userAssertion, [
    "https://graph.microsoft.com/Files.ReadWrite.All",
    "https://graph.microsoft.com/Sites.ReadWrite.All",
  ]);
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}
