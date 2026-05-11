export interface Contact {
  contactid: string;
  firstname?: string | null;
  lastname?: string | null;
  fullname?: string | null;
  emailaddress1?: string | null;
  mobilephone?: string | null;
  telephone1?: string | null;
  birthdate?: string | null;
  ua_studentnumber?: string | null;
  ua_nationalregisternumber?: string | null;
  ua_rollnumber?: string | null;
  ua_registeredaddress?: string | null;
  ua_domicileaddress?: string | null;
  ua_sisarequestgranted?: boolean | null;
  ua_sisarequestgrantedon?: string | null;
}

export interface RequestRow {
  ua_requestid: string;
  ua_name?: string | null;
  ua_filenumber?: string | null;
  createdon?: string;
  modifiedon?: string;
  statuscode?: number | null;
  statecode?: number | null;
  ua_satusreason?: string | null;
  ua_substatuscode?: string | null;
  _ua_student_value?: string | null;
  _ua_filetypeid_value?: string | null;
  _ua_filesubtypeid_value?: string | null;
  ua_iban?: string | null;
  ua_bic?: string | null;
  ua_motivation?: string | null;
  ua_isalleenstaand?: boolean | null;
  ua_referenceyear?: string | null;
  ua_filetypeid?: FileType;
  ua_filesubtypeid?: FileSubtype;
  ua_student?: Contact;
}

export interface FileType {
  ua_filetypeid: string;
  ua_name?: string | null;
  ua_id?: string | null;
  ua_sharepointid?: string | null;
}

export interface FileSubtype {
  ua_filesubtypeid: string;
  ua_name?: string | null;
  ua_id?: string | null;
  _ua_filetypeid_value?: string | null;
}

export interface FileDocument {
  ua_filedocumentid: string;
  ua_name?: string | null;
  ua_documentcode?: string | null;
  ua_info?: string | null;
  ua_required?: boolean | null;
}

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

export interface Comment {
  ua_commentid?: string;
  ua_name?: string | null;
  ua_comment?: string | null;
  ua_authortype?: "student" | "dossierbeheerder" | null;
  createdon?: string;
  _ua_requestid_value?: string | null;
  _ownerid_value?: string | null;
}

export interface SharePointDocumentLocation {
  sharepointdocumentlocationid: string;
  name?: string | null;
  absoluteurl?: string | null;
  relativeurl?: string | null;
  _regardingobjectid_value?: string | null;
  _parentsiteorlocation_value?: string | null;
}

export interface DataverseListResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}
