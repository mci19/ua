import { jsonOk, withApi } from "@/lib/api/withApi";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { requireAuthContext } from "@/lib/auth/session";
import {
  createComment,
  getCurrentStudent,
  getRequest,
  listComments,
} from "@/lib/dataverse/queries";
import { commentSchema } from "@/lib/schemas/request";
import { ApiError } from "@/lib/utils/errors";

export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  const request = await getRequest(auth, id);
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  if (request._ua_studentid_value !== student.contactid) {
    throw new ApiError(403, "Not your request");
  }
  const rows = await listComments(auth, id, auth.email);
  return jsonOk(rows);
});

export const POST = withApi<{ id: string }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  enforceRateLimit("comment", auth.oid);
  const request = await getRequest(auth, id);
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  if (request._ua_studentid_value !== student.contactid) {
    throw new ApiError(403, "Not your request");
  }
  const { text } = commentSchema.parse(await req.json());
  const created = await createComment(auth, id, text);
  return jsonOk(created, { status: 201 });
});
