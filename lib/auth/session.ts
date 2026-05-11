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

export async function requireAuthContext(req?: Request): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user) throw new ApiError(401, "Not authenticated");

  if (isDemoMode) {
    const email = session.user.email ?? "";
    return {
      oid: session.user.oid ?? email,
      email,
      name: session.user.name,
      userAssertion: "demo",
    };
  }

  // Reconstruct a Request from incoming headers when one isn't provided
  const r = req ?? new Request("http://internal", { headers: await headers() });
  const token = await getToken({
    req: r as never,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const oid = (token?.oid as string | undefined) ?? session.user.oid;
  const userAssertion = token?.userAssertion as string | undefined;
  if (!oid || !userAssertion) {
    throw new ApiError(401, "Token does not include assertion or oid");
  }
  return {
    oid,
    email: session.user.email ?? "",
    name: session.user.name,
    userAssertion,
  };
}
