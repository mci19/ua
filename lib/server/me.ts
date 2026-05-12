import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { requireAuthContext } from "@/lib/auth/session";
import { getCurrentStudent } from "@/lib/dataverse/queries";
import { routes } from "@/lib/constants/routes";
import { ApiError } from "@/lib/utils/errors";
import type { Contact } from "@/lib/dataverse/types";

// In Server Components we never want to *throw* on auth failure — that surfaces
// as the generic "An error occurred in the Server Components render" message.
// Instead redirect: to /login when there's no session, to /onboarding/unknown
// when the session has no matching Dataverse contact.
export async function requireStudent(): Promise<{
  auth: Awaited<ReturnType<typeof requireAuthContext>>;
  student: Contact;
}> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  let context: Awaited<ReturnType<typeof requireAuthContext>>;
  try {
    context = await requireAuthContext();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/login");
    }
    throw err;
  }
  const student = await getCurrentStudent(context);
  if (!student) redirect(routes.unknownUser);
  return { auth: context, student };
}
