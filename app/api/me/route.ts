import { jsonOk, withApi } from "@/lib/api/withApi";
import { requireAuthContext } from "@/lib/auth/session";
import { getCurrentStudent } from "@/lib/dataverse/queries";
import { ApiError } from "@/lib/utils/errors";

export const GET = withApi(async () => {
  const auth = await requireAuthContext();
  const student = await getCurrentStudent(auth);
  if (!student) {
    throw new ApiError(404, "Student not found", {
      dutchMessage: "We konden je studentenaccount niet vinden in onze systemen.",
    });
  }
  return jsonOk(student);
});
