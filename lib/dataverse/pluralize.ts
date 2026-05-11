export const ENTITY_SETS = {
  contact: "contacts",
  ua_request: "ua_requests",
  ua_comment: "ua_comments",
  ua_filetype: "ua_filetypes",
  ua_filesubtype: "ua_filesubtypes",
  ua_filedocument: "ua_filedocuments",
  ua_document: "ua_documents",
  ua_academicyear: "ua_academicyears",
  ua_attachment: "ua_attachments",
  sharepointdocumentlocation: "sharepointdocumentlocations",
} as const;

export type EntityName = keyof typeof ENTITY_SETS;
