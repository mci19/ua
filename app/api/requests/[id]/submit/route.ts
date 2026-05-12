import { jsonOk, withApi } from "@/lib/api/withApi";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { requireAuthContext } from "@/lib/auth/session";
import {
  getCurrentStudent,
  getRequest,
  submitRequest,
} from "@/lib/dataverse/queries";
import { ApiError } from "@/lib/utils/errors";

export const POST = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  enforceRateLimit("submitRequest", `${auth.oid}::${id}`);
  const row = await getRequest(auth, id);
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  if (row._ua_studentid_value !== student.contactid) {
    throw new ApiError(403, "Not your request");
  }
  await submitRequest(auth, id);
  return jsonOk({ id });
});
