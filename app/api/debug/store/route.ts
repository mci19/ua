import { auth } from "@/lib/auth/auth";
import { isDemoMode } from "@/lib/demo/flag";
import { listFiletypes, listRequestsForStudent } from "@/lib/demo/store";

// Demo-only diagnostic: dumps what's currently in the in-memory store so
// we can verify the seed actually loaded. Returns 404 in production.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDemoMode) {
    return new Response("Demo mode is not enabled.", { status: 404 });
  }
  const session = await auth();
  const annaRequests = await listRequestsForStudent(
    "00000000-0000-0000-0000-000000000001",
  );
  const tomRequests = await listRequestsForStudent(
    "00000000-0000-0000-0000-000000000002",
  );
  return Response.json({
    ok: true,
    sessionEmail: session?.user?.email ?? null,
    filetypes: listFiletypes().map((f) => ({ id: f.ua_filetypeid, code: f.ua_id, name: f.ua_name })),
    annaRequests: annaRequests.map((r) => ({
      id: r.ua_requestid,
      filenumber: r.ua_filenumber,
      statuscode: r.statuscode,
      _ua_studentid_value: r._ua_studentid_value,
      _ua_filetypeid_value: r._ua_filetypeid_value,
    })),
    tomRequests: tomRequests.map((r) => ({
      id: r.ua_requestid,
      filenumber: r.ua_filenumber,
    })),
  });
}
