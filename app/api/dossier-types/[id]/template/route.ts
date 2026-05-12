import { withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import { getFiletypeByCode, getFiletypeTemplate } from "@/lib/dataverse/queries";
import { ApiError } from "@/lib/utils/errors";

// Streams the most recent PDF annotation attached to the matching ua_filetype
// row. Param `id` accepts either the GUID or the textual code (e.g.
// "ua_voorschotstudietoelage"). Staff manage the PDF in the model-driven app;
// the portal always serves the latest version.
export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();

  let filetypeId = id;
  if (!isGuid(id)) {
    const ft = await getFiletypeByCode(auth, id);
    if (!ft) throw new ApiError(404, "Unknown dossier type");
    filetypeId = ft.ua_filetypeid;
  }

  const ann = await getFiletypeTemplate(auth, filetypeId);
  if (!ann?.documentbody) {
    throw new ApiError(404, "Geen sjabloon gevonden", {
      dutchMessage:
        "Voor dit dossiertype is geen sjabloon beschikbaar. Contacteer je dossierbeheerder.",
    });
  }

  const bytes = Uint8Array.from(Buffer.from(ann.documentbody, "base64"));
  const filename = ann.filename ?? "sjabloon.pdf";
  // Hard-pin to application/pdf: even if a staff user uploads a Word
  // document by mistake, refusing to mirror that mimetype prevents
  // serving an executable type back to the browser.
  const ALLOWED_MIME = new Set([
    "application/pdf",
    "application/x-pdf",
  ]);
  const mimetype = ALLOWED_MIME.has(ann.mimetype ?? "")
    ? ann.mimetype!
    : "application/pdf";

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": mimetype,
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
});

function isGuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
