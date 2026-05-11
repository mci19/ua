import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/session";
import { getCurrentStudent } from "@/lib/dataverse/queries";
import { routes } from "@/lib/constants/routes";
import type { Contact } from "@/lib/dataverse/types";

export async function requireStudent(): Promise<{
  auth: Awaited<ReturnType<typeof requireAuthContext>>;
  student: Contact;
}> {
  const auth = await requireAuthContext();
  const student = await getCurrentStudent(auth);
  if (!student) redirect(routes.unknownUser);
  return { auth, student };
}
