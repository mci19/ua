import { REQUEST_STATUS_CODE, REQUEST_SUBSTATUS_CODE } from "@/lib/constants/statuses";
import { FILE_TYPE_CODE } from "@/lib/constants/dossierTypes";
import type {
  AnnotationRow,
  Comment,
  Contact,
  DocumentRow,
  FileType,
  RequestRow,
  RequiredDocument,
} from "@/lib/dataverse/types";

// ----- Demo accounts -----

export interface DemoUser {
  username: string;
  password: string;
  email: string;
  name: string;
  // null when the user has no matching Dataverse contact (routes to
  // /onboarding/unknown).
  contactid: string | null;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  anna: {
    username: "anna",
    password: "demo",
    email: "anna.peeters@uantwerpen.be",
    name: "Anna Peeters",
    contactid: "00000000-0000-0000-0000-000000000001",
  },
  tom: {
    username: "tom",
    password: "demo",
    email: "tom.janssens@uantwerpen.be",
    name: "Tom Janssens",
    contactid: "00000000-0000-0000-0000-000000000002",
  },
  lara: {
    username: "lara",
    password: "demo",
    email: "lara.onbekend@uantwerpen.be",
    name: "Lara Onbekend",
    contactid: null,
  },
};

// ----- File types catalog (immutable) -----

const FILETYPES: FileType[] = [
  {
    ua_filetypeid: "ft-toegekend",
    ua_id: FILE_TYPE_CODE.STUDIETOELAGE_TOEGEKEND,
    ua_name: "Sociale toelage — studietoelage toegekend",
  },
  {
    ua_filetypeid: "ft-leefloon",
    ua_id: FILE_TYPE_CODE.LEEFLOON,
    ua_name: "Sociale toelage — leefloon",
  },
  {
    ua_filetypeid: "ft-vermoede",
    ua_id: FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT,
    ua_name: "Sociale toelage — vermoede van tekort",
  },
  {
    ua_filetypeid: "ft-voorschot",
    ua_id: FILE_TYPE_CODE.VOORSCHOT_STUDIETOELAGE,
    ua_name: "Voorschot studietoelage",
  },
  {
    ua_filetypeid: "ft-volmacht",
    ua_id: FILE_TYPE_CODE.VERLENEN_VAN_VOLMACHT,
    ua_name: "Verlenen van volmacht",
  },
];

const REQUIRED_DOCS: Record<string, RequiredDocument[]> = {
  "ft-toegekend": [
    {
      configurationId: "cfg-1",
      fileDocument: {
        ua_filedocumentid: "fd-beslissing",
        ua_id: "fd-beslissing",
        ua_name: "Goedkeuring studietoelage",
        ua_documentcode: "DOC01",
        ua_info: "De beslissingsbrief van de Vlaamse overheid.",
      },
      isRequired: true,
      isApplicable: true,
    },
    {
      configurationId: "cfg-2",
      fileDocument: {
        ua_filedocumentid: "fd-loonbrief",
        ua_id: "fd-loonbrief",
        ua_name: "Laatste loonbrief van ouders",
        ua_documentcode: "DOC02",
        ua_info: "Optioneel indien je ouders bijdragen aan jouw studiekosten.",
      },
      isRequired: false,
      isApplicable: true,
    },
  ],
  "ft-leefloon": [
    {
      configurationId: "cfg-3",
      fileDocument: {
        ua_filedocumentid: "fd-leefloonattest",
        ua_id: "fd-leefloonattest",
        ua_name: "Attest leefloon OCMW",
        ua_documentcode: "DOC03",
        ua_info: "Recent OCMW-attest dat je leefloon bevestigt.",
      },
      isRequired: true,
      isApplicable: true,
    },
  ],
  "ft-vermoede": [
    {
      configurationId: "cfg-4",
      fileDocument: {
        ua_filedocumentid: "fd-toelichting",
        ua_id: "fd-toelichting",
        ua_name: "Uitgebreide toelichting",
        ua_documentcode: "DOC04",
        ua_info: "Beschrijf je financiële situatie zo gedetailleerd mogelijk.",
      },
      isRequired: true,
      isApplicable: true,
    },
  ],
  "ft-voorschot": [
    {
      configurationId: "cfg-5",
      fileDocument: {
        ua_filedocumentid: "fd-overeenkomst",
        ua_id: "fd-overeenkomst",
        ua_name: "Ondertekende overeenkomst",
        ua_documentcode: "DOC05",
        ua_info: "Download het sjabloon, onderteken en laad het terug op.",
      },
      isRequired: true,
      isApplicable: true,
    },
  ],
  "ft-volmacht": [
    {
      configurationId: "cfg-6",
      fileDocument: {
        ua_filedocumentid: "fd-volmacht",
        ua_id: "fd-volmacht",
        ua_name: "Ondertekend volmachtsdocument",
        ua_documentcode: "DOC06",
        ua_info: "Download het sjabloon, onderteken en laad het terug op.",
      },
      isRequired: true,
      isApplicable: true,
    },
  ],
};

// Minimal valid PDF (Hello World, ~700 bytes) used as the template body.
const DEMO_PDF_BASE64 =
  "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJwzMjVTKEpJVMjJSlfQM1QwMjBQ0DEwUjA0MTBSMDQyMzAyMzMxMzAzMzlOyU4tA0qFKaQUKWQUgRSGm6ulAJUaWuhgIgFlMzGwAyJlBwBfMRMRCmVuZHN0cmVhbQplbmRvYmoKMyAwIG9iagoxMTUKZW5kb2JqCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL01lZGlhQm94IFswIDAgMjAwIDcwXQovUmVzb3VyY2VzCjw8Ci9Gb250Cjw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgMiAwIFIKL1BhcmVudCA1IDAgUgo+PgplbmRvYmoKNCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFsxIDAgUl0KPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDUgMCBSCj4+CmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAyMjMgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMjA0IDAwMDAwIG4gCjAwMDAwMDAzMzAgMDAwMDAgbiAKMDAwMDAwMDQwOSAwMDAwMCBuIAowMDAwMDAwNDU5IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNwovUm9vdCA2IDAgUgo+PgpzdGFydHhyZWYKNTA4CiUlRU9G";

// ----- Mutable state (lives on globalThis so it survives HMR + reuses
//       across module-loads within a single serverless instance) -----

interface DemoState {
  contacts: Map<string, Contact>;
  requests: Map<string, RequestRow>;
  comments: Map<string, Comment[]>;
  documents: Map<string, DocumentRow[]>;
  requestSeq: number;
  commentSeq: number;
}

const GLOBAL_KEY = "__ua_demo_state__" as const;

// Augment globalThis so TS lets us cache there.
declare global {
  // eslint-disable-next-line no-var
  var __ua_demo_state__: DemoState | undefined;
}

function buildSeedState(): DemoState {
  const filetypeOf = (id: string) => FILETYPES.find((f) => f.ua_filetypeid === id);
  const contacts = new Map<string, Contact>();
  const requests = new Map<string, RequestRow>();
  const comments = new Map<string, Comment[]>();
  const documents = new Map<string, DocumentRow[]>();

  // Anna — SISA granted, 2 existing requests
  contacts.set("00000000-0000-0000-0000-000000000001", {
    contactid: "00000000-0000-0000-0000-000000000001",
    firstname: "Anna",
    lastname: "Peeters",
    fullname: "Anna Peeters",
    emailaddress1: "anna.peeters@uantwerpen.be",
    ua_useremail: "anna.peeters@uantwerpen.be",
    birthdate: "2002-04-15",
    mobilephone: "+32 477 12 34 56",
    ua_studentnumber: "20200001",
    ua_nationalregisternumber: "02041500111",
    address1_composite: "Prinsstraat 13, 2000 Antwerpen, België",
    address2_composite: "Stadscampus, Kot 4B, 2000 Antwerpen",
    ua_sisarequestgranted: true,
    ua_sisarequestgrantedon: "2026-03-15T09:00:00Z",
  });

  // Tom — also SISA granted by default so the demo flow works without the
  // SISA gate blocking him. The grant flow is still reachable via Lara →
  // permission page if you want to demo it.
  contacts.set("00000000-0000-0000-0000-000000000002", {
    contactid: "00000000-0000-0000-0000-000000000002",
    firstname: "Tom",
    lastname: "Janssens",
    fullname: "Tom Janssens",
    emailaddress1: "tom.janssens@uantwerpen.be",
    ua_useremail: "tom.janssens@uantwerpen.be",
    birthdate: "2003-09-02",
    mobilephone: "+32 478 99 88 77",
    ua_studentnumber: "20200002",
    ua_nationalregisternumber: "03090200222",
    address1_composite: "Lange Nieuwstraat 55, 2000 Antwerpen, België",
    ua_sisarequestgranted: true,
    ua_sisarequestgrantedon: "2026-04-01T08:00:00Z",
  });

  const annaRequest1: RequestRow = {
    ua_requestid: "req-anna-1",
    ua_name: "Aanvraag sociale toelage",
    ua_filenumber: "ST-2026-0001",
    createdon: "2026-04-20T08:30:00Z",
    modifiedon: "2026-04-20T08:30:00Z",
    statuscode: REQUEST_STATUS_CODE.IN_BEHANDELING,
    ua_substatuscode: REQUEST_SUBSTATUS_CODE.ACTIE_VEREIST,
    _ua_studentid_value: "00000000-0000-0000-0000-000000000001",
    _ua_filetypeid_value: "ft-toegekend",
    ua_iban: "BE68 5390 0754 7034",
    ua_motivation:
      "Mijn ouders kunnen mijn studiekosten dit jaar niet dekken. Ik volg een voltijdse opleiding en heb een lopende studietoelage van de Vlaamse overheid ontvangen.",
    ua_referenceyear: "2025-2026",
    ua_isalleenstaand: false,
    ua_filetypeid: filetypeOf("ft-toegekend"),
  };
  const annaRequest2: RequestRow = {
    ua_requestid: "req-anna-2",
    ua_name: "Aanvraag voorschot",
    ua_filenumber: "VS-2026-0007",
    createdon: "2026-05-02T13:15:00Z",
    modifiedon: "2026-05-02T13:15:00Z",
    statuscode: REQUEST_STATUS_CODE.IN_AANMAAK,
    _ua_studentid_value: "00000000-0000-0000-0000-000000000001",
    _ua_filetypeid_value: "ft-voorschot",
    ua_iban: "BE68 5390 0754 7034",
    ua_motivation: "",
    ua_referenceyear: "2025-2026",
    ua_filetypeid: filetypeOf("ft-voorschot"),
  };
  requests.set(annaRequest1.ua_requestid, annaRequest1);
  requests.set(annaRequest2.ua_requestid, annaRequest2);

  comments.set("req-anna-1", [
    {
      id: "c1",
      text: "Bedankt voor je aanvraag. Kun je nog je laatste loonbrief toevoegen?",
      createdOn: "2026-04-22T10:30:00Z",
      role: "dossierbeheerder",
      authorName: "Marc Van Damme",
    },
    {
      id: "c2",
      text: "Bedankt, ik laad ze vandaag op.",
      createdOn: "2026-04-22T14:05:00Z",
      role: "student",
      authorName: "Anna Peeters",
    },
  ]);
  comments.set("req-anna-2", []);
  documents.set("req-anna-1", [
    {
      ua_documentid: "doc-anna-1-id",
      ua_filename: "studietoelagebeslissing.pdf",
      ua_isuploaded: true,
      ua_isnotapplicable: false,
      ua_lastuploadon: "2026-04-20T08:32:00Z",
      _ua_requestid_value: "req-anna-1",
      _ua_filedocumentid_value: "fd-beslissing",
    },
  ]);
  documents.set("req-anna-2", []);

  return { contacts, requests, comments, documents, requestSeq: 100, commentSeq: 1000 };
}

function state(): DemoState {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = buildSeedState();
  }
  return globalThis[GLOBAL_KEY];
}

// ----- API (mirrors lib/dataverse/queries.ts) -----

export function getContactByEmail(email: string): Contact | null {
  const lower = email.toLowerCase();
  for (const c of state().contacts.values()) {
    if (
      c.emailaddress1?.toLowerCase() === lower ||
      c.ua_useremail?.toLowerCase() === lower
    ) {
      return c;
    }
  }
  return null;
}

export function getContact(contactid: string): Contact | null {
  return state().contacts.get(contactid) ?? null;
}

export function grantSisa(contactid: string): void {
  const s = state();
  const c = s.contacts.get(contactid);
  if (!c) return;
  s.contacts.set(contactid, {
    ...c,
    ua_sisarequestgranted: true,
    ua_sisarequestgrantedon: new Date().toISOString(),
  });
}

export function listFiletypes(): FileType[] {
  return FILETYPES;
}

export function findFiletypeByCode(code: string): FileType | null {
  return FILETYPES.find((f) => f.ua_id === code) ?? null;
}

export function listRequestsForStudent(contactid: string): RequestRow[] {
  return Array.from(state().requests.values())
    .filter((r) => r._ua_studentid_value === contactid)
    .sort((a, b) => (b.createdon ?? "").localeCompare(a.createdon ?? ""));
}

export function getRequestById(requestId: string): RequestRow | null {
  return state().requests.get(requestId) ?? null;
}

export function findOpenRequest(
  contactid: string,
  filetypeId: string,
): RequestRow | null {
  return (
    Array.from(state().requests.values()).find(
      (r) =>
        r._ua_studentid_value === contactid &&
        r._ua_filetypeid_value === filetypeId &&
        r.statuscode === REQUEST_STATUS_CODE.IN_AANMAAK,
    ) ?? null
  );
}

export function createDemoRequest(input: {
  studentId: string;
  fileTypeId: string;
  iban?: string | null;
  bic?: string | null;
  motivation?: string | null;
  isAlleenstaand?: boolean | null;
  referenceYear?: string | null;
}): RequestRow {
  const s = state();
  const id = `req-demo-${++s.requestSeq}`;
  const ft = FILETYPES.find((f) => f.ua_filetypeid === input.fileTypeId);
  const row: RequestRow = {
    ua_requestid: id,
    ua_name: `Demo aanvraag ${s.requestSeq}`,
    ua_filenumber: `DM-2026-${String(s.requestSeq).padStart(4, "0")}`,
    createdon: new Date().toISOString(),
    modifiedon: new Date().toISOString(),
    statuscode: REQUEST_STATUS_CODE.IN_AANMAAK,
    _ua_studentid_value: input.studentId,
    _ua_filetypeid_value: input.fileTypeId,
    ua_iban: input.iban ?? null,
    ua_bic: input.bic ?? null,
    ua_motivation: input.motivation ?? null,
    ua_isalleenstaand: input.isAlleenstaand ?? null,
    ua_referenceyear: input.referenceYear ?? null,
    ua_filetypeid: ft,
  };
  s.requests.set(id, row);
  s.comments.set(id, []);
  s.documents.set(id, []);
  return row;
}

export function updateDemoRequest(id: string, patch: Partial<RequestRow>): void {
  const s = state();
  const cur = s.requests.get(id);
  if (!cur) return;
  s.requests.set(id, { ...cur, ...patch, modifiedon: new Date().toISOString() });
}

export function listRequiredDocs(filetypeId: string): RequiredDocument[] {
  return REQUIRED_DOCS[filetypeId] ?? [];
}

export function listRequiredDocsByCode(code: string): RequiredDocument[] {
  const ft = findFiletypeByCode(code);
  if (!ft) return [];
  return listRequiredDocs(ft.ua_filetypeid);
}

export function listDocs(requestId: string): DocumentRow[] {
  return state().documents.get(requestId) ?? [];
}

export function setNotApplicable(
  requestId: string,
  fileDocumentId: string,
  notApplicable: boolean,
): DocumentRow | null {
  const s = state();
  const arr = s.documents.get(requestId) ?? [];
  const filtered = arr.filter((d) => d._ua_filedocumentid_value !== fileDocumentId);
  if (!notApplicable) {
    s.documents.set(requestId, filtered);
    return null;
  }
  const row: DocumentRow = {
    ua_documentid: `doc-${requestId}-${fileDocumentId}-na`,
    ua_isuploaded: false,
    ua_isnotapplicable: true,
    _ua_requestid_value: requestId,
    _ua_filedocumentid_value: fileDocumentId,
  };
  filtered.push(row);
  s.documents.set(requestId, filtered);
  return row;
}

export function recordDemoUpload(
  requestId: string,
  fileDocumentId: string,
  filename: string,
): DocumentRow {
  const s = state();
  const arr = s.documents.get(requestId) ?? [];
  const filtered = arr.filter((d) => d._ua_filedocumentid_value !== fileDocumentId);
  const row: DocumentRow = {
    ua_documentid: `doc-${requestId}-${fileDocumentId}-${Date.now()}`,
    ua_filename: filename,
    ua_isuploaded: true,
    ua_isnotapplicable: false,
    ua_sharepointurl: `https://demo.sharepoint.invalid/${requestId}/${encodeURIComponent(filename)}`,
    ua_lastuploadon: new Date().toISOString(),
    _ua_requestid_value: requestId,
    _ua_filedocumentid_value: fileDocumentId,
  };
  filtered.push(row);
  s.documents.set(requestId, filtered);
  return row;
}

export function listDemoComments(requestId: string): Comment[] {
  return state().comments.get(requestId) ?? [];
}

export function appendDemoComment(
  requestId: string,
  text: string,
  authorEmail: string,
): Comment {
  const s = state();
  const arr = s.comments.get(requestId) ?? [];
  const c = getContactByEmail(authorEmail);
  const created: Comment = {
    id: `c-${++s.commentSeq}`,
    text,
    createdOn: new Date().toISOString(),
    role: "student",
    authorName: c?.fullname ?? authorEmail,
  };
  arr.push(created);
  s.comments.set(requestId, arr);
  return created;
}

export function getDemoTemplate(_fileTypeIdOrCode: string): AnnotationRow {
  return {
    annotationid: "ann-demo",
    filename: "demo-sjabloon.pdf",
    mimetype: "application/pdf",
    documentbody: DEMO_PDF_BASE64,
    isdocument: true,
  };
}
