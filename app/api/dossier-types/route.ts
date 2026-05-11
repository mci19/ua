import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import { listFiletypes } from "@/lib/dataverse/queries";

export const GET = withApi(async () => {
  const auth = await requireAuthContext();
  const rows = await listFiletypes(auth);
  return jsonOk(rows);
});
