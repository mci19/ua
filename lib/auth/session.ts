import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { ApiError } from "@/lib/utils/errors";
import { isDemoMode } from "@/lib/demo/flag";

export interface AuthContext {
  oid: string;
  email: string;
  name?: string | null;
  userAssertion: string;
}

// NextAuth v5 exposes `auth()` for the session but only `getToken()` for the
// raw JWT (which holds the OBO userAssertion). `getToken` expects a Request,
// so when we're called from a Server Component (no Request in scope) we
// synthesise one from the incoming headers. From a Route Handler the caller
// can pass `req` directly to avoid the indirection.
export async function requireAuthContext(req?: Request): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "Not authenticated", {
      dutchMessage: "Je bent niet (meer) aangemeld. Meld je opnieuw aan.",
    });
  }

  if (isDemoMode) {
    const email = session.user.email ?? "";
    return {
      oid: session.user.oid ?? email,
      email,
      name: session.user.name,
      userAssertion: "demo",
    };
  }

  const tokenSource =
    req ?? new Request("http://internal", { headers: await headers() });
  const token = await getToken({
    req: tokenSource as never,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const oid = (token?.oid as string | undefined) ?? session.user.oid;
  const userAssertion = token?.userAssertion as string | undefined;
  if (!oid || !userAssertion) {
    throw new ApiError(401, "Token does not include assertion or oid", {
      dutchMessage: "Je sessie is verlopen. Meld je opnieuw aan.",
    });
  }
  // Reject expired tokens early instead of letting MSAL bounce them.
  const expiresAt = token?.expiresAt as number | undefined;
  if (expiresAt && expiresAt * 1000 < Date.now()) {
    throw new ApiError(401, "Access token expired", {
      dutchMessage: "Je sessie is verlopen. Meld je opnieuw aan.",
    });
  }
  return {
    oid,
    email: session.user.email ?? "",
    name: session.user.name,
    userAssertion,
  };
}
