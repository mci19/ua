import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import { getFiletypeByCode, listRequiredDocuments } from "@/lib/dataverse/queries";
import { ApiError } from "@/lib/utils/errors";

// Param `id` may be either the GUID (ua_filetypeid) or the textual code (ua_id),
// since the canvas-style code (e.g. "ua_voorschotstudietoelage") is what the
// front-end knows.
export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  let filetypeId = id;
  if (!isGuid(id)) {
    const ft = await getFiletypeByCode(auth, id);
    if (!ft) throw new ApiError(404, "Unknown dossier type");
    filetypeId = ft.ua_filetypeid;
  }
  const docs = await listRequiredDocuments(auth, filetypeId);
  return jsonOk(docs);
});

function isGuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
