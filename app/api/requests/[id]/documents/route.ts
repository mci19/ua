import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import {
  clearDocumentForReupload,
  findRequestFolder,
  getCurrentStudent,
  getRequest,
  listDocumentsForRequest,
  setDocumentNotApplicable,
} from "@/lib/dataverse/queries";
import { exchangeForGraphToken } from "@/lib/auth/tokens";
import { createGraphClient } from "@/lib/graph/client";
import { ensureFolder, uploadDocument } from "@/lib/graph/sharepoint";
import { ApiError } from "@/lib/utils/errors";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
]);

export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  await assertOwnership(auth, id);
  const rows = await listDocumentsForRequest(auth, id);
  return jsonOk(rows);
});

export const POST = withApi<{ id: string }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  const request = await assertOwnership(auth, id);

  const form = await req.formData();
  const file = form.get("file");
  const notApplicableFlag = form.get("notApplicable");
  const fileDocumentId = form.get("fileDocumentId");

  if (typeof fileDocumentId !== "string" || !fileDocumentId) {
    throw new ApiError(400, "fileDocumentId required", {
      dutchMessage: "Het document-type ontbreekt.",
    });
  }

  if (notApplicableFlag === "true" || notApplicableFlag === "false") {
    const created = await setDocumentNotApplicable(
      auth,
      id,
      fileDocumentId,
      notApplicableFlag === "true",
    );
    return jsonOk(created, { status: 201 });
  }

  if (!(file instanceof File)) {
    throw new ApiError(400, "No file", { dutchMessage: "Geen bestand ontvangen." });
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(413, "Too large", {
      dutchMessage: "Het bestand is groter dan 25 MB.",
    });
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    throw new ApiError(415, "Unsupported file type", {
      dutchMessage:
        "Alleen PDF, JPG, PNG, Word- en Excel-bestanden worden ondersteund.",
    });
  }

  // Wipe previous document row for this filedoc so re-upload replaces.
  await clearDocumentForReupload(auth, id, fileDocumentId);

  const graphToken = await exchangeForGraphToken(auth.oid, auth.userAssertion);
  const graph = createGraphClient(graphToken);

  const siteId = required("SHAREPOINT_SITE_ID");
  const driveId = required("SHAREPOINT_DRIVE_ID");
  const baseFolder = (process.env.SHAREPOINT_REQUEST_FOLDER ?? "Aanvragen").replace(
    /^\/+|\/+$/g,
    "",
  );

  const location = await findRequestFolder(auth, id);
  let folderPath: string;
  if (location?.relativeurl) {
    folderPath = location.relativeurl.replace(/^\/+/, "");
  } else {
    const folderName = request.ua_filenumber ?? id;
    folderPath = await ensureFolder({
      client: graph,
      siteId,
      driveId,
      parentPath: baseFolder,
      folderName,
    });
  }

  const buffer = await file.arrayBuffer();
  const uploaded = await uploadDocument({
    client: graph,
    siteId,
    driveId,
    folderPath,
    filename: file.name,
    content: buffer,
    contentType: file.type,
  });

  return jsonOk(uploaded, { status: 201 });
});

async function assertOwnership(
  auth: Awaited<ReturnType<typeof requireAuthContext>>,
  requestId: string,
) {
  const request = await getRequest(auth, requestId);
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  if (request._ua_studentid_value !== student.contactid) {
    throw new ApiError(403, "Not your request");
  }
  return request;
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new ApiError(500, `Missing env var: ${key}`);
  return v;
}
