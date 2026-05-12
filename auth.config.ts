import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { isDemoMode } from "@/lib/demo/flag";
import { DEMO_USERS } from "@/lib/demo/store";

const demoProvider = Credentials({
  id: "demo",
  name: "Demo login",
  credentials: {
    username: { label: "Gebruiker", type: "text", placeholder: "anna / tom / lara" },
    password: { label: "Wachtwoord", type: "password", placeholder: "demo" },
  },
  async authorize(credentials) {
    const username = String(credentials?.username ?? "").toLowerCase().trim();
    const password = String(credentials?.password ?? "");
    const user = DEMO_USERS[username];
    if (!user || user.password !== password) return null;
    return {
      id: user.username,
      email: user.email,
      name: user.name,
    };
  },
});

// Ask for Dataverse + Graph scopes at sign-in so the first OBO exchange
// succeeds without AADSTS65001 "consent required". Admin-consent in the
// Entra portal keeps students from seeing the consent screen at all.
function entraScopes(): string {
  const dataverseScope = process.env.DATAVERSE_URL
    ? `${process.env.DATAVERSE_URL.replace(/\/$/, "")}/user_impersonation`
    : null;
  return [
    "openid",
    "profile",
    "email",
    "offline_access",
    "https://graph.microsoft.com/Files.ReadWrite.All",
    "https://graph.microsoft.com/Sites.ReadWrite.All",
    dataverseScope,
  ]
    .filter(Boolean)
    .join(" ");
}

const entraProvider = MicrosoftEntraID({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
  authorization: {
    params: {
      scope: entraScopes(),
    },
  },
});

// Lightweight refresh-token exchange — uses the v2 endpoint directly to
// avoid spinning up MSAL inside the JWT callback. The whole call must
// complete in well under the Auth.js JWT-callback budget (~5s), so we
// keep a tight 5s timeout.
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
} | null> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: entraScopes(),
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        signal: controller.signal,
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const config = {
  providers: isDemoMode ? [demoProvider] : [entraProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account) {
        if (account.provider === "demo") {
          token.userAssertion = "demo";
          token.oid = (user?.email as string) ?? account.providerAccountId;
        } else {
          // Refuse cross-tenant logins: a real Entra ID token from a foreign
          // tenant could otherwise authenticate, even with our issuer pinned.
          const expectedTenant = process.env.AZURE_AD_TENANT_ID;
          const actualTenant = (profile as { tid?: string } | undefined)?.tid;
          if (expectedTenant && actualTenant && actualTenant !== expectedTenant) {
            throw new Error(
              `Tenant mismatch: expected ${expectedTenant}, got ${actualTenant}`,
            );
          }
          token.userAssertion = account.access_token;
          token.refreshToken = account.refresh_token;
          token.idToken = account.id_token;
          token.oid =
            (profile as { oid?: string } | undefined)?.oid ?? account.providerAccountId;
          token.expiresAt = account.expires_at;
        }
      }
      if (profile) {
        token.email =
          (profile as { email?: string; preferred_username?: string }).email ??
          (profile as { preferred_username?: string }).preferred_username ??
          token.email;
        token.name = profile.name ?? token.name;
      }
      if (user) {
        token.email = (user.email as string | undefined) ?? token.email;
        token.name = (user.name as string | undefined) ?? token.name;
      }
      // A6 silent refresh: if the user-assertion access-token is within 2 min
      // of expiry and we still have a refresh-token, swap it for a fresh
      // one. Bouncing the user back to the Entra login page mid-form is a
      // poor UX; the refresh-token's own 24h-90d sliding window covers
      // multi-day visits comfortably.
      if (
        token.expiresAt &&
        typeof token.expiresAt === "number" &&
        token.refreshToken &&
        typeof token.refreshToken === "string" &&
        token.expiresAt - 120 < Math.floor(Date.now() / 1000)
      ) {
        try {
          const refreshed = await refreshAccessToken(token.refreshToken);
          if (refreshed) {
            token.userAssertion = refreshed.accessToken;
            token.refreshToken = refreshed.refreshToken ?? token.refreshToken;
            token.expiresAt = refreshed.expiresAt;
          }
        } catch {
          // Refresh failed → leave the existing token in place; the
          // downstream OBO exchange will fail with 401 and the caller
          // gets bounced to /login. Don't crash here.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.oid = token.oid as string | undefined;
        session.user.email = (token.email as string | undefined) ?? session.user.email;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
} satisfies NextAuthConfig;

export default config;
