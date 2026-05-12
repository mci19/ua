import { createDataverseClient, escapeOData } from "@/lib/dataverse/client";
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

export async function getDataverseFor(auth: AuthContext) {
  const token = await exchangeForDataverseToken(auth.oid, auth.userAssertion);
  return createDataverseClient(token);
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
  const dv = await getDataverseFor(auth);
  return dv.list<RequestRow>(ENTITY_SETS.ua_request, {
    $select: REQUEST_SELECT,
    $expand: "ua_filetypeid($select=ua_id,ua_name)",
    $filter: `_ua_studentid_value eq ${contactId}`,
    $orderby: "createdon desc",
  });
}

export async function getRequest(auth: AuthContext, requestId: string): Promise<RequestRow> {
  if (isDemoMode) {
    const row = await demo.getRequestById(requestId);
    if (!row) throw new Error("Request not found");
    return row;
  }
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
  const dv = await getDataverseFor(auth);
  const body: Record<string, unknown> = {
    "ua_studentid@odata.bind": `/${ENTITY_SETS.contact}(${input.studentId})`,
    "ua_filetypeid@odata.bind": `/${ENTITY_SETS.ua_filetype}(${input.fileTypeId})`,
    statuscode: REQUEST_STATUS_CODE.IN_AANMAAK,
  };
  if (input.iban !== undefined) body.ua_iban = input.iban;
  if (input.bic !== undefined) body.ua_bic = input.bic;
  if (input.motivation !== undefined) body.ua_motivation = input.motivation;
  if (input.isAlleenstaand !== undefined) body.ua_isalleenstaand = input.isAlleenstaand;
  if (input.referenceYear !== undefined) body.ua_referenceyear = input.referenceYear;
  return dv.create<RequestRow>(ENTITY_SETS.ua_request, body);
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
  const dv = await getDataverseFor(auth);
  const body: Record<string, unknown> = {};
  if (patch.iban !== undefined) body.ua_iban = patch.iban;
  if (patch.bic !== undefined) body.ua_bic = patch.bic;
  if (patch.motivation !== undefined) body.ua_motivation = patch.motivation;
  if (patch.isAlleenstaand !== undefined) body.ua_isalleenstaand = patch.isAlleenstaand;
  if (patch.referenceYear !== undefined) body.ua_referenceyear = patch.referenceYear;
  if (patch.statuscode !== undefined) body.statuscode = patch.statuscode;
  await dv.update(ENTITY_SETS.ua_request, requestId, body);
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

// ua_comment is an Activity entity with no custom author flag. We expand
// createdby and infer role by comparing its email to the calling student's.
export async function listComments(
  auth: AuthContext,
  requestId: string,
  studentEmail: string,
): Promise<Comment[]> {
  if (isDemoMode) return demo.listDemoComments(requestId);
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<CommentRow>(ENTITY_SETS.ua_comment, {
    $select:
      "activityid,ua_comment,ua_isactionrequired,createdon,_createdby_value,_ownerid_value,_ua_requestid_value",
    $expand: "createdby($select=systemuserid,fullname,internalemailaddress)",
    $filter: `_ua_requestid_value eq ${requestId}`,
    $orderby: "createdon asc",
  });
  const me = studentEmail.toLowerCase();
  return rows.map((r) => {
    const authorEmail = r.createdby?.internalemailaddress?.toLowerCase() ?? "";
    const role = authorEmail && authorEmail === me ? "student" : "dossierbeheerder";
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
  const dv = await getDataverseFor(auth);
  // ownerid + createdby are filled in by Dataverse from the caller's identity.
  const created = await dv.create<CommentRow>(ENTITY_SETS.ua_comment, {
    "ua_requestid@odata.bind": `/${ENTITY_SETS.ua_request}(${requestId})`,
    ua_comment: text,
    subject: text.slice(0, 200),
  });
  return { id: created.activityid };
}

export async function findRequestFolder(
  auth: AuthContext,
  requestId: string,
): Promise<SharePointDocumentLocation | null> {
  if (isDemoMode) return null;
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
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<AnnotationRow>(ENTITY_SETS.annotation, {
    $select: "annotationid,filename,mimetype,documentbody,isdocument,_objectid_value",
    $filter: `_objectid_value eq ${fileTypeId} and isdocument eq true`,
    $orderby: "createdon desc",
    $top: 1,
  });
  return rows[0] ?? null;
}
