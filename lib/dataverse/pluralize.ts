export const ENTITY_SETS = {
  contact: "contacts",
  ua_request: "ua_requests",
  ua_comment: "ua_comments",
  ua_filetype: "ua_filetypes",
  ua_filedocument: "ua_filedocuments",
  ua_documentconfiguration: "ua_documentconfigurations",
  ua_document: "ua_documents",
  ua_academicyear: "ua_academicyears",
  sharepointdocumentlocation: "sharepointdocumentlocations",
  annotation: "annotations",
  systemuser: "systemusers",
} as const;

export type EntityName = keyof typeof ENTITY_SETS;
