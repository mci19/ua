import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import {
  createRequest,
  findOpenRequestOfType,
  getCurrentStudent,
  getFilesubtypeByCode,
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
    return jsonOk(
      { existingId: existing.ua_requestid },
      { status: 409 },
    );
  }

  let fileSubtypeId: string | undefined;
  if ("fileSubtypeCode" in input && input.fileSubtypeCode) {
    const sub = await getFilesubtypeByCode(auth, input.fileSubtypeCode);
    if (!sub) {
      throw new ApiError(400, "Unknown subtype", {
        dutchMessage: "Het gekozen scenario bestaat niet (meer).",
      });
    }
    fileSubtypeId = sub.ua_filesubtypeid;
  }

  const created = await createRequest(auth, {
    studentId: student.contactid,
    fileTypeId: fileType.ua_filetypeid,
    fileSubtypeId,
    iban: "iban" in input ? input.iban : undefined,
    motivation: "motivation" in input ? input.motivation : undefined,
    isAlleenstaand: "isAlleenstaand" in input ? input.isAlleenstaand : undefined,
    referenceYear: "referenceYear" in input ? input.referenceYear : undefined,
  });

  return jsonOk(created, { status: 201 });
});
