import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/session";
import { getRequest } from "@/lib/dataverse/queries";
import { REQUEST_STATUS } from "@/lib/constants/statuses";
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
  if (request.ua_satusreason === REQUEST_STATUS.IN_AANMAAK) {
    redirect(routes.requestForm(id));
  }
  redirect(routes.requestMessages(id));
}
