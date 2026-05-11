import { jsonOk, withApi } from "@/lib/api/withApi";
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
  const row = await getRequest(auth, id);
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  if (row._ua_student_value !== student.contactid) {
    throw new ApiError(403, "Not your request");
  }
  await submitRequest(auth, id);
  return jsonOk({ id });
});
