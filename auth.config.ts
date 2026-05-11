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

const entraProvider = MicrosoftEntraID({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
  authorization: {
    params: {
      scope: "openid profile email offline_access",
    },
  },
});

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
