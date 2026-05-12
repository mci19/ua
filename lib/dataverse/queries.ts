import { assertGuid, createDataverseClient, escapeOData } from "@/lib/dataverse/client";
import { ENTITY_SETS } from "@/lib/dataverse/pluralize";
import { exchangeForDataverseToken } from "@/lib/auth/tokens";
import type { AuthContext } from "@/lib/auth/session";
import type {
  AnnotationRow,
  Comment,
  CommentRow,
  Contact,
  DocumentConfigurationRow,
  DocumentRow,
  FileType,
  RequestRow,
  RequiredDocument,
  SharePointDocumentLocation,
} from "@/lib/dataverse/types";
import { REQUEST_STATUS_CODE } from "@/lib/constants/statuses";
import { isDemoMode } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/store";
import { ApiError } from "@/lib/utils/errors";

// Now app-only (client_credentials, Application User). The `auth` arg is
// retained for signature stability — only the rate-limit + ownership-check
// layers still need it — but the actual Dataverse token does NOT depend on
// the student's identity.
export async function getDataverseFor(_auth: AuthContext) {
  const token = await exchangeForDataverseToken("", "");
  return createDataverseClient(token);
}

// Application User's systemuser id, cached process-local after the first
// WhoAmI call. We compare _createdby_value on comments against this id to
// distinguish comments authored by the portal (= student) from comments
// authored by staff in the model-driven app. Replaces the old email-based
// heuristic that broke once Dataverse access went app-only.
let cachedAppUserId: string | null = null;
async function getAppUserSystemUserId(): Promise<string | null> {
  if (isDemoMode) return null;
  if (cachedAppUserId) return cachedAppUserId;
  try {
    const token = await exchangeForDataverseToken("", "");
    const base = (process.env.DATAVERSE_URL ?? "").replace(/\/$/, "");
    const res = await fetch(`${base}/api/data/v9.2/WhoAmI`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { UserId?: string };
    cachedAppUserId = body.UserId ?? null;
    return cachedAppUserId;
  } catch {
    return null;
  }
}

const CONTACT_SELECT =
  "contactid,firstname,lastname,fullname,emailaddress1,ua_useremail,mobilephone,telephone1,birthdate," +
  "address1_composite,address1_line1,address1_postalcode,address1_city,address1_country," +
  "address2_composite,address2_line1,address2_postalcode,address2_city," +
  "ua_studentnumber,ua_nationalregisternumber,ua_sisarequestgranted,ua_sisarequestgrantedon";

const REQUEST_SELECT =
  "ua_requestid,ua_name,ua_filenumber,createdon,modifiedon,statuscode,statecode,ua_substatuscode," +
  "_ua_studentid_value,_ua_filetypeid_value," +
  "ua_iban,ua_bic,ua_motivation,ua_isalleenstaand,ua_referenceyear";

export async function getCurrentStudent(auth: AuthContext): Promise<Contact | null> {
  if (isDemoMode) return demo.getContactByEmail(auth.email);
  if (!auth.email) return null;
  const dv = await getDataverseFor(auth);
  // Prefer ua_useremail (UPN) for the lookup; fall back to emailaddress1.
  const email = escapeOData(auth.email.toLowerCase());
  const filter = `tolower(ua_useremail) eq '${email}' or tolower(emailaddress1) eq '${email}'`;
  const rows = await dv.list<Contact>(ENTITY_SETS.contact, {
    $select: CONTACT_SELECT,
    $filter: filter,
    $top: 1,
  });
  return rows[0] ?? null;
}

export async function grantSisaPermission(auth: AuthContext, contactId: string): Promise<void> {
  if (isDemoMode) {
    await demo.grantSisa(contactId);
    return;
  }
  const dv = await getDataverseFor(auth);
  await dv.update(ENTITY_SETS.contact, contactId, {
    ua_sisarequestgranted: true,
    ua_sisarequestgrantedon: new Date().toISOString(),
  });
}

export async function listMyRequests(
  auth: AuthContext,
  contactId: string,
): Promise<RequestRow[]> {
  if (isDemoMode) return demo.listRequestsForStudent(contactId);
  assertGuid(contactId, "contactId");
  const dv = await getDataverseFor(auth);
  // Power users with long histories can exceed Dataverse's default 5000-row
  // page; listAll follows @odata.nextLink so the list is complete.
  return dv.listAll<RequestRow>(ENTITY_SETS.ua_request, {
    $select: REQUEST_SELECT,
    $expand: "ua_filetypeid($select=ua_id,ua_name)",
    $filter: `_ua_studentid_value eq ${contactId}`,
    $orderby: "createdon desc",
  });
}

export async function getRequest(auth: AuthContext, requestId: string): Promise<RequestRow> {
  if (isDemoMode) {
    const row = await demo.getRequestById(requestId);
    if (!row) {
      throw new ApiError(404, "Request not found", {
        dutchMessage: "Deze aanvraag bestaat niet (meer).",
      });
    }
    return row;
  }
  assertGuid(requestId, "requestId");
  const dv = await getDataverseFor(auth);
  return dv.get<RequestRow>(ENTITY_SETS.ua_request, requestId, {
    $select: REQUEST_SELECT,
    $expand:
      "ua_filetypeid($select=ua_id,ua_name,ua_sharepointid)," +
      "ua_studentid($select=" +
      CONTACT_SELECT +
      ")",
  });
}

export interface CreateRequestInput {
  studentId: string;
  fileTypeId: string;
  iban?: string | null;
  bic?: string | null;
  motivation?: string | null;
  isAlleenstaand?: boolean | null;
  referenceYear?: string | null;
}

export async function createRequest(
  auth: AuthContext,
  input: CreateRequestInput,
): Promise<RequestRow> {
  if (isDemoMode) {
    return await demo.createDemoRequest({
      studentId: input.studentId,
      fileTypeId: input.fileTypeId,
      iban: input.iban,
      bic: input.bic,
      motivation: input.motivation,
      isAlleenstaand: input.isAlleenstaand,
      referenceYear: input.referenceYear,
    });
  }
  assertGuid(input.studentId, "studentId");
  assertGuid(input.fileTypeId, "fileTypeId");
  const dv = await getDataverseFor(auth);
  const body: CreateRequestBody = {
    "ua_studentid@odata.bind": `/${ENTITY_SETS.contact}(${input.studentId})`,
    "ua_filetypeid@odata.bind": `/${ENTITY_SETS.ua_filetype}(${input.fileTypeId})`,
    statuscode: REQUEST_STATUS_CODE.IN_AANMAAK,
  };
  if (input.iban !== undefined) body.ua_iban = input.iban;
  if (input.bic !== undefined) body.ua_bic = input.bic;
  if (input.motivation !== undefined) body.ua_motivation = input.motivation;
  if (input.isAlleenstaand !== undefined) body.ua_isalleenstaand = input.isAlleenstaand;
  if (input.referenceYear !== undefined) body.ua_referenceyear = input.referenceYear;
  return dv.create<RequestRow>(ENTITY_SETS.ua_request, body as unknown as Record<string, unknown>);
}

// Typed bodies for Dataverse Web API create/update calls. Catches typos at
// compile time and clarifies which OData binding belongs to which entity.
interface CreateRequestBody {
  "ua_studentid@odata.bind": string;
  "ua_filetypeid@odata.bind": string;
  statuscode: number;
  ua_iban?: string | null;
  ua_bic?: string | null;
  ua_motivation?: string | null;
  ua_isalleenstaand?: boolean | null;
  ua_referenceyear?: string | null;
}

interface UpdateRequestBody {
  statuscode?: number;
  ua_iban?: string | null;
  ua_bic?: string | null;
  ua_motivation?: string | null;
  ua_isalleenstaand?: boolean | null;
  ua_referenceyear?: string | null;
}

export async function updateRequest(
  auth: AuthContext,
  requestId: string,
  patch: Partial<CreateRequestInput> & { statuscode?: number },
): Promise<void> {
  if (isDemoMode) {
    const cur = await demo.getRequestById(requestId);
    if (!cur) return;
    const next: Partial<RequestRow> = {};
    if (patch.iban !== undefined) next.ua_iban = patch.iban ?? null;
    if (patch.bic !== undefined) next.ua_bic = patch.bic ?? null;
    if (patch.motivation !== undefined) next.ua_motivation = patch.motivation ?? null;
    if (patch.isAlleenstaand !== undefined)
      next.ua_isalleenstaand = patch.isAlleenstaand ?? null;
    if (patch.referenceYear !== undefined)
      next.ua_referenceyear = patch.referenceYear ?? null;
    if (patch.statuscode !== undefined) next.statuscode = patch.statuscode;
    await demo.updateDemoRequest(requestId, next);
    return;
  }
  assertGuid(requestId, "requestId");
  const dv = await getDataverseFor(auth);
  const body: UpdateRequestBody = {};
  if (patch.iban !== undefined) body.ua_iban = patch.iban;
  if (patch.bic !== undefined) body.ua_bic = patch.bic;
  if (patch.motivation !== undefined) body.ua_motivation = patch.motivation;
  if (patch.isAlleenstaand !== undefined) body.ua_isalleenstaand = patch.isAlleenstaand;
  if (patch.referenceYear !== undefined) body.ua_referenceyear = patch.referenceYear;
  if (patch.statuscode !== undefined) body.statuscode = patch.statuscode;
  await dv.update(ENTITY_SETS.ua_request, requestId, body as unknown as Record<string, unknown>);
}

export async function submitRequest(auth: AuthContext, requestId: string): Promise<void> {
  await updateRequest(auth, requestId, { statuscode: REQUEST_STATUS_CODE.IN_WACHT });
}

export async function listFiletypes(auth: AuthContext): Promise<FileType[]> {
  if (isDemoMode) return demo.listFiletypes();
  const dv = await getDataverseFor(auth);
  return dv.list<FileType>(ENTITY_SETS.ua_filetype, {
    $select: "ua_filetypeid,ua_name,ua_id,ua_sharepointid",
    $orderby: "ua_name asc",
  });
}

export async function getFiletypeByCode(
  auth: AuthContext,
  code: string,
): Promise<FileType | null> {
  if (isDemoMode) return demo.findFiletypeByCode(code);
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<FileType>(ENTITY_SETS.ua_filetype, {
    $select: "ua_filetypeid,ua_name,ua_id,ua_sharepointid",
    $filter: `ua_id eq '${escapeOData(code)}'`,
    $top: 1,
  });
  return rows[0] ?? null;
}

// Joins ua_documentconfiguration with ua_filedocument so the front-end gets,
// for each row, the document plus the per-filetype isRequired/isApplicable flags.
export async function listRequiredDocuments(
  auth: AuthContext,
  fileTypeId: string,
): Promise<RequiredDocument[]> {
  if (isDemoMode) return demo.listRequiredDocs(fileTypeId);
  assertGuid(fileTypeId, "fileTypeId");
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<DocumentConfigurationRow>(
    ENTITY_SETS.ua_documentconfiguration,
    {
      $select:
        "ua_documentconfigurationid,ua_isrequired,ua_isivt,_ua_documentid_value,_ua_dossiertypeid_value",
      $expand: "ua_documentid($select=ua_filedocumentid,ua_name,ua_documentcode,ua_id,ua_info)",
      $filter: `_ua_dossiertypeid_value eq ${fileTypeId}`,
    },
  );
  return rows
    .filter((r) => !!r.ua_documentid)
    .map((r) => ({
      configurationId: r.ua_documentconfigurationid,
      fileDocument: r.ua_documentid!,
      isRequired: !!r.ua_isrequired,
      isApplicable: r.ua_isivt !== false,
    }));
}

export async function listDocumentsForRequest(
  auth: AuthContext,
  requestId: string,
): Promise<DocumentRow[]> {
  if (isDemoMode) return demo.listDocs(requestId);
  assertGuid(requestId, "requestId");
  const dv = await getDataverseFor(auth);
  return dv.list<DocumentRow>(ENTITY_SETS.ua_document, {
    $select:
      "ua_documentid,ua_name,ua_filename,ua_isuploaded,ua_isnotapplicable,ua_sharepointurl,ua_lastuploadon,_ua_requestid_value,_ua_filedocumentid_value",
    $filter: `_ua_requestid_value eq ${requestId}`,
  });
}

// If a previous ua_document exists for this (request, filedocument), wipe it so
// re-upload / re-toggle replaces instead of duplicating.
async function deleteExistingDocumentRows(
  auth: AuthContext,
  requestId: string,
  fileDocumentId: string,
): Promise<void> {
  assertGuid(requestId, "requestId");
  assertGuid(fileDocumentId, "fileDocumentId");
  const dv = await getDataverseFor(auth);
  const existing = await dv.list<DocumentRow>(ENTITY_SETS.ua_document, {
    $select: "ua_documentid",
    $filter:
      `_ua_requestid_value eq ${requestId} and ` +
      `_ua_filedocumentid_value eq ${fileDocumentId}`,
  });
  await Promise.all(
    existing.map((row) => dv.delete(ENTITY_SETS.ua_document, row.ua_documentid)),
  );
}

export async function setDocumentNotApplicable(
  auth: AuthContext,
  requestId: string,
  fileDocumentId: string,
  notApplicable: boolean,
): Promise<DocumentRow | null> {
  if (isDemoMode) return demo.setNotApplicable(requestId, fileDocumentId, notApplicable);
  const dv = await getDataverseFor(auth);
  await deleteExistingDocumentRows(auth, requestId, fileDocumentId);
  if (!notApplicable) return null;
  return dv.create<DocumentRow>(ENTITY_SETS.ua_document, {
    "ua_requestid@odata.bind": `/${ENTITY_SETS.ua_request}(${requestId})`,
    "ua_filedocumentid@odata.bind": `/${ENTITY_SETS.ua_filedocument}(${fileDocumentId})`,
    ua_isnotapplicable: true,
    ua_isuploaded: false,
  });
}

export async function clearDocumentForReupload(
  auth: AuthContext,
  requestId: string,
  fileDocumentId: string,
): Promise<void> {
  if (isDemoMode) {
    demo.setNotApplicable(requestId, fileDocumentId, false);
    return;
  }
  await deleteExistingDocumentRows(auth, requestId, fileDocumentId);
}

// Role-detection (A3 resolved without schema change):
// All comments authored via this portal are written by the Application
// User (S2S). Staff write comments via the model-driven app under their
// own systemuser identity. So `_createdby_value == AppUser.systemuserid`
// ⇒ a student-authored comment; anything else ⇒ staff/dossierbeheerder.
// `studentEmail` is no longer used for role inference but is kept in the
// signature for callers who pass it; remove next major.
export async function listComments(
  auth: AuthContext,
  requestId: string,
  _studentEmail: string,
): Promise<Comment[]> {
  if (isDemoMode) return demo.listDemoComments(requestId);
  assertGuid(requestId, "requestId");
  const [dv, appUserId] = await Promise.all([
    getDataverseFor(auth),
    getAppUserSystemUserId(),
  ]);
  const rows = await dv.list<CommentRow>(ENTITY_SETS.ua_comment, {
    $select:
      "activityid,ua_comment,ua_isactionrequired,createdon,_createdby_value,_ownerid_value,_ua_requestid_value",
    $expand: "createdby($select=systemuserid,fullname,internalemailaddress)",
    $filter: `_ua_requestid_value eq ${requestId}`,
    $orderby: "createdon asc",
  });
  return rows.map((r) => {
    const role: Comment["role"] =
      appUserId && r._createdby_value === appUserId ? "student" : "dossierbeheerder";
    return {
      id: r.activityid ?? `${r._createdby_value}-${r.createdon}`,
      text: r.ua_comment ?? "",
      createdOn: r.createdon,
      role,
      authorName: r.createdby?.fullname ?? undefined,
    };
  });
}

export async function createComment(
  auth: AuthContext,
  requestId: string,
  text: string,
): Promise<{ id?: string }> {
  if (isDemoMode) {
    const c = await demo.appendDemoComment(requestId, text, auth.email);
    return { id: c.id };
  }
  assertGuid(requestId, "requestId");
  const dv = await getDataverseFor(auth);
  // Two parent-pointers are populated:
  // 1. regardingobjectid_ua_request — the OOTB polymorphic Activity lookup
  //    that staff filter views and Power Automate flows rely on
  // 2. ua_requestid — the custom OneToMany lookup defined in
  //    customizations.xml (relationship `ua_comment_requestid_ua_request`,
  //    ReferencingAttributeName `ua_requestid`). Both nav-property forms
  //    are accepted by Dataverse Web API; we pick the short attribute name
  //    that matches the *_value column used in $filter elsewhere.
  // subject is non-nullable on Activity entities; we fall back to a
  // placeholder when the comment is short.
  const trimmedSubject = text.slice(0, 200).trim() || "Bericht";
  // ownerid + createdby are filled in by Dataverse from the caller's identity.
  const created = await dv.create<CommentRow>(ENTITY_SETS.ua_comment, {
    "regardingobjectid_ua_request@odata.bind": `/${ENTITY_SETS.ua_request}(${requestId})`,
    "ua_requestid@odata.bind": `/${ENTITY_SETS.ua_request}(${requestId})`,
    ua_comment: text,
    subject: trimmedSubject,
  });
  return { id: created.activityid };
}

export async function findRequestFolder(
  auth: AuthContext,
  requestId: string,
): Promise<SharePointDocumentLocation | null> {
  if (isDemoMode) return null;
  assertGuid(requestId, "requestId");
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<SharePointDocumentLocation>(
    ENTITY_SETS.sharepointdocumentlocation,
    {
      $select:
        "sharepointdocumentlocationid,name,absoluteurl,relativeurl,_regardingobjectid_value,_parentsiteorlocation_value",
      $filter: `_regardingobjectid_value eq ${requestId}`,
      $top: 1,
    },
  );
  return rows[0] ?? null;
}

export async function findOpenRequestOfType(
  auth: AuthContext,
  contactId: string,
  fileTypeId: string,
): Promise<RequestRow | null> {
  if (isDemoMode) return demo.findOpenRequest(contactId, fileTypeId);
  assertGuid(contactId, "contactId");
  assertGuid(fileTypeId, "fileTypeId");
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<RequestRow>(ENTITY_SETS.ua_request, {
    $select: "ua_requestid,statuscode,_ua_filetypeid_value,_ua_studentid_value",
    $filter:
      `_ua_studentid_value eq ${contactId} and _ua_filetypeid_value eq ${fileTypeId} ` +
      `and statuscode eq ${REQUEST_STATUS_CODE.IN_AANMAAK}`,
    $top: 1,
  });
  return rows[0] ?? null;
}

// PDF templates for advance/PoA are stored as annotations (notes) on the
// matching ua_filetype row. Returns base64-encoded body + mimetype.
export async function getFiletypeTemplate(
  auth: AuthContext,
  fileTypeId: string,
): Promise<AnnotationRow | null> {
  if (isDemoMode) return demo.getDemoTemplate(fileTypeId);
  assertGuid(fileTypeId, "fileTypeId");
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<AnnotationRow>(ENTITY_SETS.annotation, {
    $select: "annotationid,filename,mimetype,documentbody,isdocument,_objectid_value",
    $filter: `_objectid_value eq ${fileTypeId} and isdocument eq true`,
    $orderby: "createdon desc",
    $top: 1,
  });
  return rows[0] ?? null;
}
