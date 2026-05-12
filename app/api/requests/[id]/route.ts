import { jsonOk, withApi } from "@/lib/api/withApi";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { requireAuthContext } from "@/lib/auth/session";
import { getCurrentStudent, getRequest, updateRequest } from "@/lib/dataverse/queries";
import { ApiError } from "@/lib/utils/errors";
import { updateRequestSchema } from "@/lib/schemas/request";
import { isEditable } from "@/lib/constants/statuses";

export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  const row = await getRequest(auth, id);
  await assertOwnership(auth, row);
  return jsonOk(row);
});

export const PATCH = withApi<{ id: string }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  enforceRateLimit("updateRequest", auth.oid);
  const row = await getRequest(auth, id);
  await assertOwnership(auth, row);
  if (!isEditable(row.statuscode)) {
    throw new ApiError(409, "Request is not editable", {
      dutchMessage: "Deze aanvraag is al ingediend en kan niet meer worden aangepast.",
    });
  }
  const json = await req.json();
  const patch = updateRequestSchema.parse(json);
  await updateRequest(auth, id, patch);
  return jsonOk({ id });
});

async function assertOwnership(
  auth: Awaited<ReturnType<typeof requireAuthContext>>,
  row: { _ua_studentid_value?: string | null },
) {
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  if (row._ua_studentid_value !== student.contactid) {
    throw new ApiError(403, "Not your request");
  }
}
