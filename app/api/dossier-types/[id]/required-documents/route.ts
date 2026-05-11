import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import { listRequiredDocuments } from "@/lib/dataverse/queries";

export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  const docs = await listRequiredDocuments(auth, id);
  return jsonOk(docs);
});
