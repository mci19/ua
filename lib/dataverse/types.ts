// Verified entity & attribute names from
// /tmp/ua-analysis/ua_base/customizations.xml.

export interface Contact {
  contactid: string;
  firstname?: string | null;
  lastname?: string | null;
  fullname?: string | null;
  emailaddress1?: string | null;
  ua_useremail?: string | null;
  mobilephone?: string | null;
  telephone1?: string | null;
  birthdate?: string | null;
  address1_composite?: string | null;
  address1_line1?: string | null;
  address1_postalcode?: string | null;
  address1_city?: string | null;
  address1_country?: string | null;
  address2_composite?: string | null;
  address2_line1?: string | null;
  address2_postalcode?: string | null;
  address2_city?: string | null;
  ua_studentnumber?: string | null;
  ua_nationalregisternumber?: string | null;
  ua_sisarequestgranted?: boolean | null;
  ua_sisarequestgrantedon?: string | null;
}

export interface FileType {
  ua_filetypeid: string;
  ua_name?: string | null;
  ua_id?: string | null;
  ua_sharepointid?: string | null;
}

export interface RequestRow {
  ua_requestid: string;
  ua_name?: string | null;
  ua_filenumber?: string | null;
  createdon?: string;
  modifiedon?: string;
  // statuscode is the Active-state status reason (integer optionset).
  // statecode separates Active (0) from Inactive (1).
  statuscode?: number | null;
  statecode?: number | null;
  ua_substatuscode?: number | null;
  _ua_studentid_value?: string | null;
  _ua_filetypeid_value?: string | null;
  ua_iban?: string | null;
  ua_bic?: string | null;
  ua_motivation?: string | null;
  ua_isalleenstaand?: boolean | null;
  ua_referenceyear?: string | null;
  ua_filetypeid?: FileType;
  ua_studentid?: Contact;
}

export interface FileDocument {
  ua_filedocumentid: string;
  ua_name?: string | null;
  ua_documentcode?: string | null;
  ua_id?: string | null;
  ua_info?: string | null;
}

// Result of joining ua_documentconfiguration → ua_filedocument for a given filetype.
export interface RequiredDocument {
  configurationId: string;
  fileDocument: FileDocument;
  isRequired: boolean;
  isApplicable: boolean;
}

export interface DocumentConfigurationRow {
  ua_documentconfigurationid: string;
  ua_isrequired?: boolean | null;
  ua_isivt?: boolean | null;
  _ua_documentid_value?: string | null;
  _ua_dossiertypeid_value?: string | null;
  ua_documentid?: FileDocument;
}

// Custom entity used to track per-request document state (uploaded vs N.v.t.).
export interface DocumentRow {
  ua_documentid: string;
  ua_name?: string | null;
  ua_filename?: string | null;
  ua_isuploaded?: boolean | null;
  ua_isnotapplicable?: boolean | null;
  ua_sharepointurl?: string | null;
  ua_lastuploadon?: string | null;
  _ua_requestid_value?: string | null;
  _ua_filedocumentid_value?: string | null;
}

export interface SystemUserRef {
  systemuserid?: string;
  fullname?: string | null;
  internalemailaddress?: string | null;
}

// ua_comment is an Activity entity. The only custom attributes that exist are:
// ua_comment (text), ua_commentnumber, ua_isactionrequired, ua_requestid, ua_spguid.
// To distinguish staff vs student we expand createdby and compare against the
// student's email.
export interface CommentRow {
  activityid?: string;
  ua_comment?: string | null;
  ua_isactionrequired?: boolean | null;
  createdon?: string;
  _ownerid_value?: string | null;
  _createdby_value?: string | null;
  _ua_requestid_value?: string | null;
  createdby?: SystemUserRef;
  ownerid?: SystemUserRef;
}

export type CommentRole = "student" | "dossierbeheerder";

export interface Comment {
  id: string;
  text: string;
  createdOn?: string;
  role: CommentRole;
  authorName?: string;
}

export interface SharePointDocumentLocation {
  sharepointdocumentlocationid: string;
  name?: string | null;
  absoluteurl?: string | null;
  relativeurl?: string | null;
  _regardingobjectid_value?: string | null;
  _parentsiteorlocation_value?: string | null;
}

export interface AnnotationRow {
  annotationid: string;
  filename?: string | null;
  mimetype?: string | null;
  documentbody?: string | null;
  isdocument?: boolean | null;
  _objectid_value?: string | null;
}

export interface DataverseListResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}
