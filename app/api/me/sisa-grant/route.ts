import { jsonOk, withApi } from "@/lib/api/withApi";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { requireAuthContext } from "@/lib/auth/session";
import { getCurrentStudent, grantSisaPermission } from "@/lib/dataverse/queries";
import { ApiError } from "@/lib/utils/errors";

export const POST = withApi(async () => {
  const auth = await requireAuthContext();
  enforceRateLimit("sisaGrant", auth.oid);
  const student = await getCurrentStudent(auth);
  if (!student) throw new ApiError(404, "Student not found");
  await grantSisaPermission(auth, student.contactid);
  return jsonOk({ contactid: student.contactid, grantedOn: new Date().toISOString() });
});
