import { auth } from "@/lib/auth/auth";
import { requireAuthContext } from "@/lib/auth/session";
import { getCurrentStudent, listMyRequests } from "@/lib/dataverse/queries";

// Auth-required diagnostic. Dumps what the server sees for the current
// session — useful to figure out why a logged-in user appears to have no
// data. No secrets are returned.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, reason: "no session" }, { status: 401 });
  }
  let context;
  try {
    context = await requireAuthContext();
  } catch (err) {
    return Response.json({
      ok: false,
      session: { email: session.user.email, name: session.user.name, oid: session.user.oid },
      reason: "requireAuthContext failed",
      error: String(err),
    });
  }

  let student = null;
  let studentError: string | undefined;
  try {
    student = await getCurrentStudent(context);
  } catch (err) {
    studentError = String(err);
  }

  let requests: { id: string; filenumber?: string | null; statuscode?: number | null }[] = [];
  let requestsError: string | undefined;
  if (student) {
    try {
      const rows = await listMyRequests(context, student.contactid);
      requests = rows.map((r) => ({
        id: r.ua_requestid,
        filenumber: r.ua_filenumber,
        statuscode: r.statuscode,
      }));
    } catch (err) {
      requestsError = String(err);
    }
  }

  return Response.json({
    ok: true,
    session: {
      email: session.user.email,
      name: session.user.name,
      oid: session.user.oid,
    },
    context: {
      oid: context.oid,
      email: context.email,
      name: context.name,
      hasUserAssertion: !!context.userAssertion,
    },
    studentLookup: {
      found: !!student,
      contactid: student?.contactid,
      emailaddress1: student?.emailaddress1,
      ua_useremail: student?.ua_useremail,
      sisaGranted: student?.ua_sisarequestgranted,
      error: studentError,
    },
    requests: {
      count: requests.length,
      items: requests,
      error: requestsError,
    },
  });
}
