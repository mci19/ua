# UA Studentenportaal

Next.js + TypeScript rebuild of the Power Apps canvas portal where students of the Universiteit
Antwerpen submit social-allowance, study-grant-advance, and power-of-attorney requests.

The backend stays on Microsoft Dataverse and Power Automate. This app only replaces the
student-facing layer. Workflows that sync to SharePoint, send reminders, and post to EBS/SISA/Komida
keep running on Power Automate untouched.

## Stack

- Next.js 15 (App Router, RSC, Route Handlers) + TypeScript strict
- Tailwind CSS + Radix primitives (custom shadcn-style components)
- TanStack Query, React Hook Form, Zod
- Auth.js (NextAuth v5) with Microsoft Entra ID provider
- MSAL Node OBO flow to mint Dataverse + Graph tokens server-side
- `@microsoft/microsoft-graph-client` for SharePoint uploads
- `sonner` for toasts, `lucide-react` for icons

## Architecture

```
Browser ──(MSAL/NextAuth session cookie)──> Next.js
                                            ├── /api/* route handlers
                                            │     └─ OBO exchange ──> Dataverse Web API
                                            │     └─ OBO exchange ──> MS Graph (SharePoint)
                                            └─ RSC pages ─ same path
```

Power Automate continues to:
- Sync Dataverse ↔ SharePoint
- Send reminder / deactivation emails
- Push expenses to EBS / pull canteen actuals from Komida
- Provision SharePoint folders for new requests

## Running locally

```bash
pnpm install
cp .env.example .env.local   # fill in tenant / client id / secret / dataverse url
pnpm dev
```

Visit http://localhost:3000.

### Demo mode (no Azure required)

To run the whole portal against an in-memory mock store — no Azure, no Dataverse, no
SharePoint — set `UA_DEMO_MODE=true` and `AUTH_SECRET=anything` and that's it:

```bash
echo 'UA_DEMO_MODE=true' >> .env.local
echo 'AUTH_SECRET=dev'  >> .env.local
pnpm dev
```

The login page shows a username/password form with three seeded accounts (password
is always `demo`):

| User | Wachtwoord | Wat het demonstreert |
| ---- | ---------- | --------------------- |
| `anna` | `demo` | SISA toegekend, 2 bestaande aanvragen (1 in behandeling met "Actie vereist", 1 in aanmaak) |
| `tom`  | `demo` | SISA nog niet toegekend → routes naar de SISA-grant pagina |
| `lara` | `demo` | Niet gekend in Dataverse → routes naar `/onboarding/unknown` |

In demo mode:
- Uploads worden niet naar SharePoint gestuurd; ze worden alleen in memory geregistreerd.
- De PDF-template-route serveert een gegenereerde "Hello World"-PDF.
- Data persist binnen één serverproces; bij een redeploy/restart wordt de seed-state opnieuw geladen.
- Er staat een gele banner bovenaan ("DEMO MODUS — data is fictief…").

To deploy a demo to Netlify: set just `UA_DEMO_MODE=true` and `AUTH_SECRET` in the
Netlify env vars, leave everything else blank, push.

### Required Microsoft Entra app permissions (delegated)

- `openid`, `profile`, `email`, `offline_access`
- `<DATAVERSE_URL>/user_impersonation`
- Microsoft Graph: `Files.ReadWrite.All`, `Sites.ReadWrite.All`

Add the Next.js redirect URI: `<NEXTAUTH_URL>/api/auth/callback/microsoft-entra-id`.

## Project layout

```
app/                   # Next.js App Router pages + route handlers
  api/                 # JSON API (auth, me, requests, comments, documents, dossier-types)
  aanvragen/           # Student-facing flows
  onboarding/          # SISA permission + unknown-student screens
components/
  ui/                  # Primitives (button, card, input, ...)
  common/              # Topbar, PageShell, ProgressTimeline, etc.
  forms/               # Request forms (social allowance, advance, PoA, edit)
  documents/           # Document checklist + voorschot upload
  messages/            # Comment thread
  wizard/              # 4-step wizard helpers
lib/
  auth/                # NextAuth + MSAL OBO + session helpers
  dataverse/           # OData client, entity types, high-level queries
  graph/               # Graph client + SharePoint upload helpers
  schemas/             # Zod schemas (IBAN, NRN, request payloads, comments)
  constants/           # Statuses, dossier types, route map
  utils/               # cn, date, errors, logger
messages/nl.json       # i18n strings (Dutch)
```

## Routing map

| Canvas screen              | Route                                            |
| -------------------------- | ------------------------------------------------ |
| scr_invadlidUser           | `/onboarding/unknown`                            |
| scr_overview               | `/`                                              |
| scr_permissionUser         | `/onboarding/sisa`                               |
| scr_myRequests             | `/aanvragen`                                     |
| scr_requestType            | `/aanvragen/nieuw`                               |
| scr_socialAllowance        | `/aanvragen/nieuw/sociale-toelage`               |
| scr_socialAllowanceScen4   | `/aanvragen/nieuw/sociale-toelage/scenario-4`    |
| scr_form (new)             | `/aanvragen/nieuw/sociale-toelage/[scenario]`    |
| scr_form (edit/view)       | `/aanvragen/[id]/formulier`                      |
| scr_requestAdvance         | `/aanvragen/[id]/voorschot`                      |
| scr_documents              | `/aanvragen/[id]/documenten`                     |
| scr_messages               | `/aanvragen/[id]/berichten`                      |
| scr_submitted              | `/aanvragen/[id]/ingediend`                      |

## Document uploads

The browser sends a multipart `POST /api/requests/:id/documents`. The route handler:

1. Verifies the request belongs to the calling student.
2. Exchanges the user assertion for a Graph token via OBO.
3. Looks up the request's SharePoint folder via Dataverse `sharepointdocumentlocations` and
   falls back to the convention `{SHAREPOINT_REQUEST_FOLDER}/{ua_filenumber}` if needed,
   creating the folder if it doesn't exist.
4. PUTs the file to the SharePoint drive (uses upload sessions for files > 4 MB).
5. Lets the existing Power Automate `DocumentLibrary-SyncAttachmenttoDV` flow create the
   matching `ua_document` row in Dataverse — no double bookkeeping.

For "niet van toepassing" rows there is nothing to upload; we insert `ua_document` with
`ua_isnotapplicable=true` directly in Dataverse.

## Deploying

> See [RUNBOOK.md](./RUNBOOK.md) for the operational playbook (incident
> response, deep health-check, rate-limit tuning, Sentry).

### Netlify (primary target)

1. Connect this repo in the Netlify dashboard. The `netlify.toml` already sets
   build command (`pnpm build`), publish dir (`.next`), Node 22, and registers
   `@netlify/plugin-nextjs` — Netlify auto-detects Next.js and uses the plugin
   for SSR + middleware.
2. In **Site settings → Environment variables**, add every value from
   `.env.example`:
   - `AUTH_SECRET`, `NEXTAUTH_URL` (your `https://<site>.netlify.app` URL)
   - `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`
   - `DATAVERSE_URL`
   - `SHAREPOINT_SITE_ID`, `SHAREPOINT_DRIVE_ID`, `SHAREPOINT_REQUEST_FOLDER`
   - `NEXT_PUBLIC_APP_URL`
3. Add the Netlify URL as a redirect URI in your Entra app registration:
   `https://<site>.netlify.app/api/auth/callback/microsoft-entra-id`.
4. Push to the tracked branch → Netlify builds and deploys.

`next.config.ts` checks `process.env.NETLIFY` and skips `output: "standalone"`
on Netlify (standalone is only used for Docker / Azure deploys).

### Other targets

- **Vercel**: import the repo, set the same env vars, done.
- **Azure App Service / Container Apps**: `docker build .` and deploy. The
  Dockerfile uses the Next.js standalone output.
- **On-prem / k8s**: same Docker image behind your reverse proxy.

## What's still TODO

- Map per-dossier-type required documents once the M:N relation on `ua_filedocument` is
  confirmed against the live environment (the OData filter `ua_filetype/any(...)` may need
  tweaking).
- Verify the polymorphic owner lookup attribute name on `ua_comment` against the model-driven
  app metadata before depending on it for comment creation.
- Add Playwright happy-path E2E once a test tenant is available.
- Add unit tests for IBAN/NRN validators and Dataverse error mapping.
