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
import { mutateSnapshot, readSnapshot } from "@/lib/demo/snapshot";

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

// ----- Immutable seed (lives in module scope, regenerated per cold start) -----

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

const DEMO_PDF_BASE64 =
  "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJwzMjVTKEpJVMjJSlfQM1QwMjBQ0DEwUjA0MTBSMDQyMzAyMzMxMzAzMzlOyU4tA0qFKaQUKWQUgRSGm6ulAJUaWuhgIgFlMzGwAyJlBwBfMRMRCmVuZHN0cmVhbQplbmRvYmoKMyAwIG9iagoxMTUKZW5kb2JqCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL01lZGlhQm94IFswIDAgMjAwIDcwXQovUmVzb3VyY2VzCjw8Ci9Gb250Cjw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgMiAwIFIKL1BhcmVudCA1IDAgUgo+PgplbmRvYmoKNCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFsxIDAgUl0KPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDUgMCBSCj4+CmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAyMjMgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMjA0IDAwMDAwIG4gCjAwMDAwMDAzMzAgMDAwMDAgbiAKMDAwMDAwMDQwOSAwMDAwMCBuIAowMDAwMDAwNDU5IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNwovUm9vdCA2IDAgUgo+PgpzdGFydHhyZWYKNTA4CiUlRU9G";

// Seed contacts (always available, mutations to SISA go into the cookie).
const SEED_CONTACTS: Record<string, Contact> = {
  "00000000-0000-0000-0000-000000000001": {
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
  },
  "00000000-0000-0000-0000-000000000002": {
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
  },
};

const filetypeById = (id: string | null | undefined) =>
  FILETYPES.find((f) => f.ua_filetypeid === id);

// Seed requests for Anna — always present after a cold start. User mutations
// (creates / patches / status changes / new comments) live in the cookie.
const SEED_REQUESTS: RequestRow[] = [
  {
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
    ua_filetypeid: filetypeById("ft-toegekend"),
  },
  {
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
    ua_filetypeid: filetypeById("ft-voorschot"),
  },
];

const SEED_COMMENTS: Record<string, Comment[]> = {
  "req-anna-1": [
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
  ],
};

// Documents live in a global map — fictional and not critical to demo flow.
const documentsState = new Map<string, DocumentRow[]>([
  [
    "req-anna-1",
    [
      {
        ua_documentid: "doc-anna-1-id",
        ua_filename: "studietoelagebeslissing.pdf",
        ua_isuploaded: true,
        ua_isnotapplicable: false,
        ua_lastuploadon: "2026-04-20T08:32:00Z",
        _ua_requestid_value: "req-anna-1",
        _ua_filedocumentid_value: "fd-beslissing",
      },
    ],
  ],
]);

// ----- Helpers -----

function applyPatch(
  row: RequestRow,
  patch: Partial<RequestRow> | undefined,
): RequestRow {
  if (!patch) return row;
  return { ...row, ...patch, ua_filetypeid: row.ua_filetypeid };
}

async function allRequests(): Promise<RequestRow[]> {
  const snap = await readSnapshot();
  const seed = SEED_REQUESTS.map((r) => applyPatch(r, snap.patchedRequests[r.ua_requestid]));
  const created = snap.newRequests.map((r) =>
    applyPatch({ ...r, ua_filetypeid: filetypeById(r._ua_filetypeid_value) }, snap.patchedRequests[r.ua_requestid]),
  );
  return [...seed, ...created];
}

// ----- API (mirrors lib/dataverse/queries.ts) -----

export async function getContactByEmail(email: string): Promise<Contact | null> {
  const snap = await readSnapshot();
  const lower = email.toLowerCase();
  for (const c of Object.values(SEED_CONTACTS)) {
    if (
      c.emailaddress1?.toLowerCase() === lower ||
      c.ua_useremail?.toLowerCase() === lower
    ) {
      const overlay = snap.sisaGranted[c.contactid];
      if (overlay) {
        return {
          ...c,
          ua_sisarequestgranted: true,
          ua_sisarequestgrantedon: overlay,
        };
      }
      return c;
    }
  }
  return null;
}

export async function grantSisa(contactid: string): Promise<void> {
  await mutateSnapshot((s) => ({
    ...s,
    sisaGranted: { ...s.sisaGranted, [contactid]: new Date().toISOString() },
  }));
}

export function listFiletypes(): FileType[] {
  return FILETYPES;
}

export function findFiletypeByCode(code: string): FileType | null {
  return FILETYPES.find((f) => f.ua_id === code) ?? null;
}

export async function listRequestsForStudent(contactid: string): Promise<RequestRow[]> {
  const all = await allRequests();
  return all
    .filter((r) => r._ua_studentid_value === contactid)
    .sort((a, b) => (b.createdon ?? "").localeCompare(a.createdon ?? ""));
}

export async function getRequestById(requestId: string): Promise<RequestRow | null> {
  const all = await allRequests();
  return all.find((r) => r.ua_requestid === requestId) ?? null;
}

export async function findOpenRequest(
  contactid: string,
  filetypeId: string,
): Promise<RequestRow | null> {
  const all = await allRequests();
  return (
    all.find(
      (r) =>
        r._ua_studentid_value === contactid &&
        r._ua_filetypeid_value === filetypeId &&
        r.statuscode === REQUEST_STATUS_CODE.IN_AANMAAK,
    ) ?? null
  );
}

export async function createDemoRequest(input: {
  studentId: string;
  fileTypeId: string;
  iban?: string | null;
  bic?: string | null;
  motivation?: string | null;
  isAlleenstaand?: boolean | null;
  referenceYear?: string | null;
}): Promise<RequestRow> {
  const snap = await readSnapshot();
  const seq = snap.newRequests.length + 100;
  const id = `req-demo-${seq}-${Math.random().toString(36).slice(2, 6)}`;
  const row: RequestRow = {
    ua_requestid: id,
    ua_name: `Demo aanvraag ${seq}`,
    ua_filenumber: `DM-2026-${String(seq).padStart(4, "0")}`,
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
  };
  await mutateSnapshot((s) => ({ ...s, newRequests: [...s.newRequests, row] }));
  return { ...row, ua_filetypeid: filetypeById(input.fileTypeId) };
}

export async function updateDemoRequest(id: string, patch: Partial<RequestRow>): Promise<void> {
  await mutateSnapshot((s) => {
    const prev = s.patchedRequests[id] ?? {};
    return {
      ...s,
      patchedRequests: {
        ...s.patchedRequests,
        [id]: { ...prev, ...patch, modifiedon: new Date().toISOString() },
      },
    };
  });
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
  return documentsState.get(requestId) ?? [];
}

export function setNotApplicable(
  requestId: string,
  fileDocumentId: string,
  notApplicable: boolean,
): DocumentRow | null {
  const arr = documentsState.get(requestId) ?? [];
  const filtered = arr.filter((d) => d._ua_filedocumentid_value !== fileDocumentId);
  if (!notApplicable) {
    documentsState.set(requestId, filtered);
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
  documentsState.set(requestId, filtered);
  return row;
}

export function recordDemoUpload(
  requestId: string,
  fileDocumentId: string,
  filename: string,
): DocumentRow {
  const arr = documentsState.get(requestId) ?? [];
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
  documentsState.set(requestId, filtered);
  return row;
}

export async function listDemoComments(requestId: string): Promise<Comment[]> {
  const snap = await readSnapshot();
  // newComments overlay replaces seed when present (so user-appended ones
  // are visible alongside the originals — see appendDemoComment).
  if (snap.newComments[requestId]) return snap.newComments[requestId];
  return SEED_COMMENTS[requestId] ?? [];
}

export async function appendDemoComment(
  requestId: string,
  text: string,
  authorEmail: string,
): Promise<Comment> {
  const snap = await readSnapshot();
  const c = await getContactByEmail(authorEmail);
  const existing =
    snap.newComments[requestId] ?? SEED_COMMENTS[requestId] ?? [];
  const created: Comment = {
    id: `c-${Date.now()}`,
    text,
    createdOn: new Date().toISOString(),
    role: "student",
    authorName: c?.fullname ?? authorEmail,
  };
  const nextThread = [...existing, created];
  await mutateSnapshot((s) => ({
    ...s,
    newComments: { ...s.newComments, [requestId]: nextThread },
  }));
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
