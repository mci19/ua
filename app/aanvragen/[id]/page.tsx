import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/session";
import { getRequest } from "@/lib/dataverse/queries";
import { isEditable } from "@/lib/constants/statuses";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function RequestRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const request = await getRequest(auth, id);
  if (isEditable(request.statuscode)) {
    redirect(routes.requestForm(id));
  }
  redirect(routes.requestMessages(id));
}
