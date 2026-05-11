import { createDataverseClient, escapeOData } from "@/lib/dataverse/client";
import { ENTITY_SETS } from "@/lib/dataverse/pluralize";
import { exchangeForDataverseToken } from "@/lib/auth/tokens";
import type { AuthContext } from "@/lib/auth/session";
import type {
  Comment,
  Contact,
  DocumentRow,
  FileDocument,
  FileSubtype,
  FileType,
  RequestRow,
  SharePointDocumentLocation,
} from "@/lib/dataverse/types";
import { REQUEST_STATUS } from "@/lib/constants/statuses";

export async function getDataverseFor(auth: AuthContext) {
  const token = await exchangeForDataverseToken(auth.oid, auth.userAssertion);
  return createDataverseClient(token);
}

const CONTACT_SELECT =
  "contactid,firstname,lastname,fullname,emailaddress1,mobilephone,telephone1,birthdate,ua_studentnumber,ua_nationalregisternumber,ua_rollnumber,ua_registeredaddress,ua_domicileaddress,ua_sisarequestgranted,ua_sisarequestgrantedon";

const REQUEST_SELECT =
  "ua_requestid,ua_name,ua_filenumber,createdon,modifiedon,statuscode,statecode," +
  "ua_satusreason,ua_substatuscode," +
  "_ua_student_value,_ua_filetypeid_value,_ua_filesubtypeid_value," +
  "ua_iban,ua_bic,ua_motivation,ua_isalleenstaand,ua_referenceyear";

export async function getCurrentStudent(auth: AuthContext): Promise<Contact | null> {
  if (!auth.email) return null;
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<Contact>(ENTITY_SETS.contact, {
    $select: CONTACT_SELECT,
    $filter: `emailaddress1 eq '${escapeOData(auth.email.toLowerCase())}'`,
    $top: 1,
  });
  return rows[0] ?? null;
}

export async function grantSisaPermission(auth: AuthContext, contactId: string): Promise<void> {
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
  const dv = await getDataverseFor(auth);
  return dv.list<RequestRow>(ENTITY_SETS.ua_request, {
    $select: REQUEST_SELECT,
    $expand: "ua_filetypeid($select=ua_id,ua_name),ua_filesubtypeid($select=ua_id,ua_name)",
    $filter: `_ua_student_value eq ${contactId}`,
    $orderby: "createdon desc",
  });
}

export async function getRequest(auth: AuthContext, requestId: string): Promise<RequestRow> {
  const dv = await getDataverseFor(auth);
  return dv.get<RequestRow>(ENTITY_SETS.ua_request, requestId, {
    $select: REQUEST_SELECT,
    $expand:
      "ua_filetypeid($select=ua_id,ua_name,ua_sharepointid)," +
      "ua_filesubtypeid($select=ua_id,ua_name)," +
      "ua_student($select=" +
      CONTACT_SELECT +
      ")",
  });
}

export interface CreateRequestInput {
  studentId: string;
  fileTypeId: string;
  fileSubtypeId?: string;
  iban?: string;
  bic?: string;
  motivation?: string;
  isAlleenstaand?: boolean;
  referenceYear?: string;
}

export async function createRequest(
  auth: AuthContext,
  input: CreateRequestInput,
): Promise<RequestRow> {
  const dv = await getDataverseFor(auth);
  const body: Record<string, unknown> = {
    "ua_student@odata.bind": `/${ENTITY_SETS.contact}(${input.studentId})`,
    "ua_filetypeid@odata.bind": `/${ENTITY_SETS.ua_filetype}(${input.fileTypeId})`,
    ua_satusreason: REQUEST_STATUS.IN_AANMAAK,
    ua_iban: input.iban ?? null,
    ua_bic: input.bic ?? null,
    ua_motivation: input.motivation ?? null,
    ua_isalleenstaand: input.isAlleenstaand ?? null,
    ua_referenceyear: input.referenceYear ?? null,
  };
  if (input.fileSubtypeId) {
    body["ua_filesubtypeid@odata.bind"] =
      `/${ENTITY_SETS.ua_filesubtype}(${input.fileSubtypeId})`;
  }
  return dv.create<RequestRow>(ENTITY_SETS.ua_request, body);
}

export async function updateRequest(
  auth: AuthContext,
  requestId: string,
  patch: Partial<CreateRequestInput> & { status?: string },
): Promise<void> {
  const dv = await getDataverseFor(auth);
  const body: Record<string, unknown> = {};
  if (patch.iban !== undefined) body.ua_iban = patch.iban;
  if (patch.bic !== undefined) body.ua_bic = patch.bic;
  if (patch.motivation !== undefined) body.ua_motivation = patch.motivation;
  if (patch.isAlleenstaand !== undefined) body.ua_isalleenstaand = patch.isAlleenstaand;
  if (patch.referenceYear !== undefined) body.ua_referenceyear = patch.referenceYear;
  if (patch.status !== undefined) body.ua_satusreason = patch.status;
  await dv.update(ENTITY_SETS.ua_request, requestId, body);
}

export async function submitRequest(auth: AuthContext, requestId: string): Promise<void> {
  await updateRequest(auth, requestId, { status: REQUEST_STATUS.IN_WACHT });
}

export async function listFiletypes(auth: AuthContext): Promise<FileType[]> {
  const dv = await getDataverseFor(auth);
  return dv.list<FileType>(ENTITY_SETS.ua_filetype, {
    $select: "ua_filetypeid,ua_name,ua_id,ua_sharepointid",
    $orderby: "ua_name asc",
  });
}

export async function getFiletypeByCode(auth: AuthContext, code: string): Promise<FileType | null> {
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<FileType>(ENTITY_SETS.ua_filetype, {
    $select: "ua_filetypeid,ua_name,ua_id,ua_sharepointid",
    $filter: `ua_id eq '${escapeOData(code)}'`,
    $top: 1,
  });
  return rows[0] ?? null;
}

export async function getFilesubtypeByCode(
  auth: AuthContext,
  code: string,
): Promise<FileSubtype | null> {
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<FileSubtype>(ENTITY_SETS.ua_filesubtype, {
    $select: "ua_filesubtypeid,ua_name,ua_id,_ua_filetypeid_value",
    $filter: `ua_id eq '${escapeOData(code)}'`,
    $top: 1,
  });
  return rows[0] ?? null;
}

export async function listRequiredDocuments(
  auth: AuthContext,
  fileTypeId: string,
): Promise<FileDocument[]> {
  const dv = await getDataverseFor(auth);
  // Many-to-many join through ua_filetype to ua_filedocument
  return dv.list<FileDocument>(ENTITY_SETS.ua_filedocument, {
    $select: "ua_filedocumentid,ua_name,ua_documentcode,ua_info,ua_required",
    $filter: `ua_filetype/any(t:t/ua_filetypeid eq ${fileTypeId})`,
    $orderby: "ua_name asc",
  });
}

export async function listDocumentsForRequest(
  auth: AuthContext,
  requestId: string,
): Promise<DocumentRow[]> {
  const dv = await getDataverseFor(auth);
  return dv.list<DocumentRow>(ENTITY_SETS.ua_document, {
    $select:
      "ua_documentid,ua_name,ua_filename,ua_isuploaded,ua_isnotapplicable,ua_sharepointurl,ua_lastuploadon,_ua_requestid_value,_ua_filedocumentid_value",
    $filter: `_ua_requestid_value eq ${requestId}`,
  });
}

export async function setDocumentNotApplicable(
  auth: AuthContext,
  requestId: string,
  fileDocumentId: string,
): Promise<DocumentRow> {
  const dv = await getDataverseFor(auth);
  return dv.create<DocumentRow>(ENTITY_SETS.ua_document, {
    "ua_requestid@odata.bind": `/${ENTITY_SETS.ua_request}(${requestId})`,
    "ua_filedocumentid@odata.bind": `/${ENTITY_SETS.ua_filedocument}(${fileDocumentId})`,
    ua_isnotapplicable: true,
    ua_isuploaded: false,
  });
}

export async function listComments(
  auth: AuthContext,
  requestId: string,
): Promise<Comment[]> {
  const dv = await getDataverseFor(auth);
  return dv.list<Comment>(ENTITY_SETS.ua_comment, {
    $select:
      "ua_commentid,ua_name,ua_comment,ua_authortype,createdon,_ua_requestid_value,_ownerid_value",
    $filter: `_ua_requestid_value eq ${requestId}`,
    $orderby: "createdon asc",
  });
}

export async function createComment(
  auth: AuthContext,
  requestId: string,
  text: string,
): Promise<Comment> {
  const dv = await getDataverseFor(auth);
  return dv.create<Comment>(ENTITY_SETS.ua_comment, {
    "ua_requestid@odata.bind": `/${ENTITY_SETS.ua_request}(${requestId})`,
    ua_comment: text,
    ua_authortype: "student",
  });
}

export async function findRequestFolder(
  auth: AuthContext,
  requestId: string,
): Promise<SharePointDocumentLocation | null> {
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
  const dv = await getDataverseFor(auth);
  const rows = await dv.list<RequestRow>(ENTITY_SETS.ua_request, {
    $select: "ua_requestid,ua_satusreason,_ua_filetypeid_value,_ua_student_value",
    $filter:
      `_ua_student_value eq ${contactId} and _ua_filetypeid_value eq ${fileTypeId} ` +
      `and ua_satusreason eq '${REQUEST_STATUS.IN_AANMAAK}'`,
    $top: 1,
  });
  return rows[0] ?? null;
}
