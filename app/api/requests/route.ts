import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import {
  createRequest,
  findOpenRequestOfType,
  getCurrentStudent,
  getFiletypeByCode,
  listMyRequests,
} from "@/lib/dataverse/queries";
import { createRequestSchema } from "@/lib/schemas/request";
import { ApiError } from "@/lib/utils/errors";

export const GET = withApi(async () => {
  const auth = await requireAuthContext();
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  const rows = await listMyRequests(auth, student.contactid);
  return jsonOk(rows);
});

export const POST = withApi(async (req) => {
  const auth = await requireAuthContext();
  const json = await req.json();
  const input = createRequestSchema.parse(json);

  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");

  const fileType = await getFiletypeByCode(auth, input.fileTypeCode);
  if (!fileType) {
    throw new ApiError(400, "Unknown dossier type", {
      dutchMessage: "Het gekozen dossiertype bestaat niet (meer).",
    });
  }

  const existing = await findOpenRequestOfType(auth, student.contactid, fileType.ua_filetypeid);
  if (existing) {
    return jsonOk({ existingId: existing.ua_requestid }, { status: 409 });
  }

  const created = await createRequest(auth, {
    studentId: student.contactid,
    fileTypeId: fileType.ua_filetypeid,
    iban: "iban" in input ? input.iban : null,
    bic: "bic" in input && input.bic ? input.bic : null,
    motivation: "motivation" in input ? input.motivation ?? null : null,
    isAlleenstaand: "isAlleenstaand" in input ? input.isAlleenstaand : null,
    referenceYear: "referenceYear" in input ? input.referenceYear : null,
  });

  return jsonOk(created, { status: 201 });
});
