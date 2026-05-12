# UA Aanvraag toelagen — operationele runbook

Dit document bundelt: deploy-checklist, env-vars, monitoring,
en de meest waarschijnlijke incident-scenarios met stappen om ze op te
lossen of te bypassen.

## 1. Deploy-checklist (productie)

1. **Entra-app registration** klaar:
   - Redirect URI: `https://<host>/api/auth/callback/microsoft-entra-id`
   - API-permissies (delegated):
     - `openid`, `profile`, `email`, `offline_access`
     - `Dataverse user_impersonation`
     - Graph `Files.ReadWrite.All`, `Sites.ReadWrite.All`
   - Tenant-admin heeft consent gegeven voor alle bovenstaande scopes.
2. **Dataverse**:
   - Application User aanwezig met `Studentenportaal` / `Basic User` rol
     én custom rol met read/write op `ua_request`, `ua_comment`,
     `ua_document`, `ua_documentconfiguration`, en read op `contact`,
     `ua_filetype`, `ua_filedocument`, `sharepointdocumentlocation`.
   - Solution `ua_base` + `ua_logic` geïmporteerd en gepubliceerd.
3. **SharePoint**:
   - Document library "Aanvragen" beschikbaar; folders worden lazy
     aangemaakt per aanvraag door `Aanvraag-SyncDVtoSP` flow.
   - `SHAREPOINT_SITE_ID` = `<hostname>,<site-guid>,<web-guid>`
   - `SHAREPOINT_DRIVE_ID` = drive-id van die library.
4. **Netlify env vars** ingesteld (zie sectie 2). Geen secrets in
   build-logs.
5. **Smoke tests** vóór go-live:
   - `GET /api/health` → 200, mode=production, alle env-vars true.
   - `GET /api/health?deep=1` → 200 en `downstream.dataverse.ok=true`,
     `downstream.graph.ok=true`. Verwerping 503 betekent dat een
     dependency down is — zie sectie 4.
   - Login als een test-student, doorloop social-allowance flow tot
     en met indienen, verifieer dat het in Dataverse status "In wacht"
     krijgt.

## 2. Env-vars (productie)

| Var | Doel | Voorbeeld |
|-----|------|-----------|
| `AUTH_SECRET` | NextAuth cookie-encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL met scheme | `https://ua-poc.netlify.app` |
| `AZURE_AD_TENANT_ID` | UA tenant id | `<guid>` |
| `AZURE_AD_CLIENT_ID` | App-registration client id | `<guid>` |
| `AZURE_AD_CLIENT_SECRET` | App-registration secret | rotate elke 6m |
| `DATAVERSE_URL` | Dataverse environment URL | `https://uantwerpen.crm4.dynamics.com` |
| `SHAREPOINT_SITE_ID` | Graph composite site id | `host,site-guid,web-guid` |
| `SHAREPOINT_DRIVE_ID` | Aanvragen-library drive id | `<id>` |
| `SHAREPOINT_REQUEST_FOLDER` | Folder-naam in drive | `Aanvragen` |
| `NEXT_PUBLIC_APP_URL` | Public URL (client) | `https://ua-poc.netlify.app` |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` | `info` |
| `SENTRY_DSN` | (optioneel) Sentry endpoint | `https://<key>@sentry.io/<project>` |

Voor demo deploys: zet `UA_DEMO_MODE=true` én `UA_ALLOW_DEMO_IN_PROD=true`
(de tweede is een opt-in zodat productie-omgevingen niet per ongeluk in
demo-modus draaien).

## 3. Monitoring

- **`/api/health`** — light: env-vars check, geen externe calls.
- **`/api/health?deep=1`** — diep: pingt Dataverse `WhoAmI` en Graph
  `/v1.0/$metadata`. Resultaat is 30s-gecached om quota te sparen.
  Pingt service-principal-token (`client_credentials`), niet de OBO-flow.
- **Sentry** (optioneel) — verzamelt unhandled exceptions, PII gefilterd
  bovenop onze logger-redact (zie `lib/observability/sentry.ts`).
- **Correlation-ID** — elke API-response heeft een `x-request-id`-header.
  Reproduceren? Plak die id uit de browser-devtools in het log-zoekvenster
  van Netlify.

## 4. Incident-scenario's

### 4.1. Dataverse is down (5xx of timeout)

- Symptoom: `/api/health?deep=1` toont `downstream.dataverse.ok=false`.
- App-gedrag: na 5 backend-fouten binnen 60s opent de circuit-breaker en
  serveert de volgende minuut 503 met Nederlandse boodschap (zie
  `lib/api/withApi.ts`). Self-healing zodra een test-call slaagt.
- Stappen:
  1. Check Power Platform Admin Center voor environment status.
  2. Check Azure-status van het Dataverse-cluster.
  3. Geen actie nodig in de portal — 503-toestand klaart automatisch op.

### 4.2. OBO-exchange faalt (AADSTS65001 / 401)

- Symptoom: API geeft 401 of 500 met "Je sessie is verlopen…".
- Oorzaak: tenant-admin heeft een nieuwe scope toegevoegd zonder consent,
  óf de student-account hoort niet bij UA-tenant.
- Stappen:
  1. Verifieer dat alle Entra-scopes (zie sectie 1) admin-consent
     hebben gehad. `Get-MgServicePrincipal` of het Entra-portaal toont
     de status per scope.
  2. Bij tenant-mismatch error: gebruiker hoort waarschijnlijk niet bij
     UA-tenant. Tenant-binding check in `auth.config.ts` weigert dat
     opzettelijk.

### 4.3. Rate-limit triggers (HTTP 429)

- Limieten staan in `lib/api/rateLimit.ts` (`PRESETS`):
  - createRequest: 5/u
  - comment: 30/u
  - uploadDocument: 30/u
  - updateRequest: 60/u
  - submitRequest: 3/min
  - sisaGrant: 1/10s
- Limieten zijn per Netlify-instance (in-memory). Met meerdere instances
  is het effectief totaal hoger; voor strikt-globale rate-limits switch
  naar Upstash Redis (call-sites blijven gelijk).

### 4.4. SharePoint upload faalt

- Het Graph-pad kent 3 retries op 429 / 5xx met Retry-After backoff
  (zie `lib/graph/sharepoint.ts`). Mislukken alle pogingen, dan krijgt
  de student de Nederlandse foutmelding "Het bestand kon niet worden
  geüpload".
- Voor terugkerende fouten:
  1. Verifieer Graph permissies via `/api/health?deep=1`.
  2. Probeer manueel een upload via Graph Explorer met de service-
     principal credentials.
  3. Check `SHAREPOINT_DRIVE_ID` en `SHAREPOINT_SITE_ID` — een typo
     hier veroorzaakt een 404 op elke upload.

### 4.5. Demo mode per ongeluk in productie

- Symptoom: studenten zien `?demo` login-tab óf "DEMO MODUS"-banner.
- Oorzaak: `UA_DEMO_MODE=true` én `UA_ALLOW_DEMO_IN_PROD=true` staat aan.
- Stappen: zet beide op `false` (of verwijder ze) en redeploy.

## 5. Onderhoud

- **Token-cache** is LRU (max 10 000 entries, TTL 55 min). Voor langere
  sessies dan 24h moet een refresh-token cyclus draaien — die zit al in
  `auth.config.ts` (silent refresh op JWT-callback).
- **CI** draait op `.github/workflows/ci.yml`: typecheck + lint + vitest
  + build + Playwright e2e in demo-mode. Houdt PRs groen.
- **Sentry sample rate** staat default op 5% (`SENTRY_TRACES_SAMPLE_RATE`).
  Voor incidenten tijdelijk naar 1.0 zetten via Netlify env-vars en
  redeploy.

## 6. Bekende restricties / volgende-iteratie-werk

- **Comment author-detectie** in een delegated-OBO setup is correct
  zolang de student-portal en staff-portal *niet* tegelijk via
  Application-User schrijven. Beslissing met UA gevraagd (zie A3-comment
  in `lib/dataverse/queries.ts::listComments`).
- **OData paging** is aan voor `listMyRequests` (volgt `@odata.nextLink`
  tot max 20 pages). Andere lijsten zijn `$top`-begrensd.
- **CSP** mag binnenkort `unsafe-inline` verliezen via een nonce-
  middleware (Next.js 15 ondersteunt dit officieel).
- **`force-dynamic`** staat op alle session-gated pagina's. Dat is
  correct (anders zou Next.js sessie-data prerenderen) — niet
  verschuiven zonder de auth-boundary mee te verschuiven.
