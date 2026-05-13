# Opdracht — Azure-infrastructuur voor "Aanvraag toelagen"

**Doel**: De Next.js-portal `Aanvraag toelagen` hosten op Azure in plaats
van Netlify, met enterprise-grade security en zonder client-secrets in env-vars.

**Tijdslijn**: indicatief 2-3 werkdagen incl. iteraties + 1 dag domein/DNS.

**Repo**: <vul-in> — branch `claude/rebuild-app-react-tw67d`.

**Architectuur in één zin**: Container App in West Europe achter Front
Door, met System-Assigned Managed Identity die via Federated Credentials
namens de Entra-app authenticeert tegen Dataverse (Application User) en
Microsoft Graph (OBO). Geen client-secrets meer in app-config.

---

## 1. Resources — overzicht

| Resource | Type | SKU / size | Doel |
|---|---|---|---|
| `rg-ua-aanvragen-prod` | Resource Group | West Europe | Alles erin |
| `acr-uaaanvragenprod` | Container Registry | Basic | Docker images |
| `cae-ua-aanvragen-prod` | Container Apps Environment | Consumption + Dedicated D4 | Compute-laag |
| `ca-ua-aanvragen-prod` | Container App | 1-3 replicas, 0.5 vCPU/1 GiB | De Next.js-app |
| `kv-ua-aanvragen-prod` | Key Vault | Standard | `AUTH_SECRET` + andere geheimen |
| `ai-ua-aanvragen-prod` | Application Insights | Workspace-based | Tracing + logs |
| `log-ua-aanvragen-prod` | Log Analytics Workspace | Pay-as-you-go | App Insights backend |
| `afd-ua-aanvragen-prod` | Azure Front Door (Premium) | Premium | WAF, CDN, custom domain |
| `id-ua-aanvragen-prod` | Managed Identity (System-Assigned) | — | Federated naar Entra app |

Aanvullend nodig (worden door andere teams beheerd):

- **Entra App Registration** voor de portal (zie sectie 4).
- **Dataverse Application User** (zie aparte Power Platform-opdracht).
- **SharePoint-site** met document library "Aanvragen" (Power Platform-opdracht).

## 2. Resource Group + Tagging

Vereiste tags op alle resources:

```
Environment   = prod | test
CostCenter    = <UA-kostenplaats>
Application   = ua-aanvragen-toelagen
DataClass     = pii-standard
Owner         = <team-email>
ManagedBy     = terraform | bicep | manual
```

Region: **West Europe** (zelfde regio als Dataverse `crm4`, voor latency
+ data-residentie).

## 3. Container App + Compute

### 3.1. Container Registry

```bash
az acr create \
  --resource-group rg-ua-aanvragen-prod \
  --name acruaaanvragenprod \
  --sku Basic \
  --admin-enabled false
```

Geef de Managed Identity (zie sectie 4) `AcrPull` op deze registry.

### 3.2. Container Apps Environment

```bash
az containerapp env create \
  --resource-group rg-ua-aanvragen-prod \
  --name cae-ua-aanvragen-prod \
  --location westeurope \
  --logs-workspace-id <log-analytics-id> \
  --logs-workspace-key <log-analytics-key>
```

VNet integration is **optioneel** voor v1; aan te zetten zodra Dataverse
Private Endpoint vrijgegeven wordt (zie sectie 9).

### 3.3. Container App

Specs:

- **Image**: vanuit ACR — repo root heeft een `Dockerfile`. Build met
  `docker build -t acruaaanvragenprod.azurecr.io/ua-aanvragen:<sha> .`.
  Push via `az acr login`.
- **Ingress**: External, target port `3000`, transport `http`.
- **Replicas**: min 1 (no scale-to-zero — cold-start hurts auth-flows),
  max 3 op CPU > 70%.
- **System-Assigned Managed Identity**: ON.
- **Env-vars**: zie sectie 6 (uit Key Vault).

```bash
az containerapp create \
  --resource-group rg-ua-aanvragen-prod \
  --name ca-ua-aanvragen-prod \
  --environment cae-ua-aanvragen-prod \
  --image acruaaanvragenprod.azurecr.io/ua-aanvragen:initial \
  --ingress external --target-port 3000 \
  --min-replicas 1 --max-replicas 3 \
  --cpu 0.5 --memory 1.0Gi \
  --system-assigned \
  --registry-server acruaaanvragenprod.azurecr.io \
  --registry-identity system
```

### 3.4. Dockerfile-opmerking

De repo heeft al een werkende `Dockerfile` voor `output: "standalone"`.
Geen aanpassingen nodig. Let op: `NETLIFY=true` env-var **niet** zetten,
anders schakelt de app `standalone`-output uit.

## 4. Identity — Managed Identity + Federated Credentials

Dit is het kern-stuk waardoor we **geen client-secret** meer nodig hebben.

### 4.1. App Registration (Entra ID)

(Wordt door UA-IT aangemaakt in de UA-tenant — Power Platform-consultant
levert app-id + tenant-id. Naam: `UA Aanvraag toelagen`.)

Permissies op de app:

- **Delegated**: `openid`, `profile`, `email`, `offline_access`,
  Graph `Files.ReadWrite.All`, `Sites.ReadWrite.All` — admin consent.
- **Application**: `Dynamics CRM user_impersonation` — admin consent.

Redirect URI: zodra het custom domain bekend is, voeg toe als
`https://aanvragen.uantwerpen.be/api/auth/callback/microsoft-entra-id`.

### 4.2. Federated Identity Credential — koppelt MI aan App Registration

```bash
# 1. Object-id van de Container App MI ophalen
MI_PRINCIPAL_ID=$(az containerapp show \
  -g rg-ua-aanvragen-prod -n ca-ua-aanvragen-prod \
  --query identity.principalId -o tsv)

# 2. Federated credential toevoegen op de App Registration
az ad app federated-credential create \
  --id <app-registration-object-id> \
  --parameters '{
    "name": "ua-aanvragen-prod-mi",
    "issuer": "https://login.microsoftonline.com/<tenant-id>/v2.0",
    "subject": "system:managed-identity:'$MI_PRINCIPAL_ID'",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

Resultaat: de Managed Identity kan tokens vragen *namens de App
Registration* — geen secret nodig.

**LET OP** — de huidige code in `lib/auth/msal.ts` gebruikt
`ConfidentialClientApplication` met `clientSecret`. Voor MI/FIC moeten we
overschakelen naar **WorkloadIdentityCredential** (uit `@azure/identity`).
Dit is een **kleine codewijziging** die door het dev-team gedaan wordt
(geschat 2u). Tot dat klaar is: client-secret in Key Vault gebruiken.

### 4.3. Application User in Dataverse

Wordt aangemaakt door de Power Platform-consultant (zie aparte opdracht).
Belangrijk: koppel aan de **App Registration**, niet aan de MI direct —
de MI federeert ernaartoe.

## 5. Key Vault

```bash
az keyvault create \
  -g rg-ua-aanvragen-prod -n kv-ua-aanvragen-prod \
  --enable-rbac-authorization true \
  --location westeurope

# Geef de MI leesrechten op secrets
az role assignment create \
  --assignee $MI_PRINCIPAL_ID \
  --role "Key Vault Secrets User" \
  --scope $(az keyvault show -n kv-ua-aanvragen-prod --query id -o tsv)
```

Secrets om aan te maken:

| Naam in Key Vault | Inhoud |
|---|---|
| `auth-secret` | `openssl rand -base64 32` — NextAuth cookie signer |
| `azure-ad-client-secret` | Initieel: vereist tot WorkloadIdentity in code zit. Daarna verwijderbaar. |
| `sentry-dsn` | Optioneel — als we Sentry blijven gebruiken naast App Insights |

## 6. Env-vars op de Container App

Alle env-vars worden gemount uit Key Vault (geen plain text in
Container-App config):

```bash
az containerapp secret set \
  -g rg-ua-aanvragen-prod -n ca-ua-aanvragen-prod \
  --secrets \
    auth-secret=keyvaultref:https://kv-ua-aanvragen-prod.vault.azure.net/secrets/auth-secret,identityref:system

az containerapp update \
  -g rg-ua-aanvragen-prod -n ca-ua-aanvragen-prod \
  --set-env-vars \
    AUTH_SECRET=secretref:auth-secret \
    NEXTAUTH_URL=https://aanvragen.uantwerpen.be \
    AZURE_AD_TENANT_ID=<tenant-id> \
    AZURE_AD_CLIENT_ID=<app-registration-client-id> \
    DATAVERSE_URL=https://<uantwerpen>.crm4.dynamics.com \
    SHAREPOINT_SITE_ID=<host,site-guid,web-guid> \
    SHAREPOINT_DRIVE_ID=<drive-id> \
    SHAREPOINT_REQUEST_FOLDER=Aanvragen \
    NEXT_PUBLIC_APP_URL=https://aanvragen.uantwerpen.be \
    LOG_LEVEL=info \
    UA_DEMO_MODE=false \
    APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string>
```

Tijdens de transitie-fase (vóór MI/FIC werkt):

```bash
    AZURE_AD_CLIENT_SECRET=secretref:azure-ad-client-secret
```

## 7. Application Insights

```bash
# Workspace + AI app aanmaken
az monitor log-analytics workspace create \
  -g rg-ua-aanvragen-prod -n log-ua-aanvragen-prod

az monitor app-insights component create \
  -g rg-ua-aanvragen-prod -a ai-ua-aanvragen-prod \
  --workspace log-ua-aanvragen-prod --location westeurope
```

Connection-string als env-var (zie sectie 6). Geen extra code-werk
nodig — Container Apps stuurt stdout naar Log Analytics automatisch; voor
custom telemetry kan het dev-team optioneel het `applicationinsights`-
npm-pakket inhaken (vergelijkbaar met het bestaande optionele Sentry-
pad in `lib/observability/`).

**Alerts** om in te stellen:

- 5xx-rate > 5% over 5 min → email/teams
- Login success-rate < 95% over 10 min → email/teams
- Token-acquisition failures > 10/min → kritiek
- Container CPU > 80% gedurende 15 min → schaal-warning
- Geen logs gedurende 5 min → app-down

## 8. Azure Front Door + WAF

Voor custom domain, DDoS, CDN, WAF:

```bash
az afd profile create \
  -g rg-ua-aanvragen-prod \
  --profile-name afd-ua-aanvragen-prod --sku Premium_AzureFrontDoor

az afd endpoint create \
  -g rg-ua-aanvragen-prod \
  --profile-name afd-ua-aanvragen-prod \
  --endpoint-name ua-aanvragen \
  --enabled-state Enabled

# Origin = de Container App
az afd origin-group create \
  -g rg-ua-aanvragen-prod \
  --profile-name afd-ua-aanvragen-prod \
  --origin-group-name ca-origin-group \
  --probe-protocol Https --probe-path "/api/health" \
  --probe-interval-in-seconds 30 \
  --sample-size 4 --successful-samples-required 3
```

**WAF policy** — Default OWASP rule-set 2.1, plus:

- Geo-fence: alleen EU-landen toelaten (optioneel, UA-IT beslist)
- Rate-limit op `/api/auth/*`: 30 requests/min/IP
- Block known bad UAs

Custom domain: zie sectie 10.

## 9. Networking (optioneel — fase 2)

Voor v1 mag de Container App publiek staan achter Front Door. Voor fase 2:

- VNet integratie aan op de Container App
- Private Endpoint naar Dataverse (vereist Dataverse-side configuratie
  via Power Platform admin center → Private Link)
- Storage account voor build artifacts ook private endpoint
- Front Door blijft de enige publieke ingang

## 10. Custom domain + TLS

1. UA-DNS-team: CNAME van `aanvragen.uantwerpen.be` →
   `<endpoint>.azurefd.net`.
2. Domein validatie via Front Door TXT-record (geleverd door Azure).
3. Front Door managed certificate aanvragen (gratis, auto-renew).
4. Routes config: alle paths → Container App origin.
5. App Registration redirect URI updaten naar het custom domain (zie 4.1).

## 11. CI/CD — GitHub Actions met OIDC

Geen service-principal-secret in GitHub. Workflow:

```yaml
# .github/workflows/deploy.yml  (bestaat nog niet — toevoegen)
name: Deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: Build + push image
        run: |
          az acr build -t ua-aanvragen:${{ github.sha }} \
            -r acruaaanvragenprod .
      - name: Deploy to Container App
        run: |
          az containerapp update -g rg-ua-aanvragen-prod \
            -n ca-ua-aanvragen-prod \
            --image acruaaanvragenprod.azurecr.io/ua-aanvragen:${{ github.sha }}
```

Federated credential op een **deploy-app-registration** (apart van de
runtime-app):

```bash
az ad app federated-credential create \
  --id <deploy-app-id> \
  --parameters '{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<org>/<repo>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

Rollen voor de deploy-identity:

- `AcrPush` op de Container Registry
- `Container Apps Contributor` op de Container App

## 12. Smoke-tests na deploy

| # | Test | Verwacht |
|---|---|---|
| 1 | `curl https://aanvragen.uantwerpen.be/api/health` | 200, `mode=production`, alle env-vars true |
| 2 | `curl https://aanvragen.uantwerpen.be/api/health?deep=1` | 200, `downstream.dataverse.ok=true`, `downstream.graph.ok=true` |
| 3 | Browser login met test-account | Redirect naar Entra → terug op `/` (overview) |
| 4 | Check Front Door WAF logs | Geen blocks op legit requests |
| 5 | Check App Insights live metrics | Requests komen binnen, geen exceptions |

## 13. Kostenraming (indicatief, EUR/maand)

| Resource | Estimate |
|---|---|
| Container Apps (1-3 replicas, 0.5 vCPU) | €30-70 |
| Container Registry Basic | €5 |
| Key Vault | €1 |
| Application Insights + Log Analytics (5 GB/maand) | €15-30 |
| Front Door Premium + WAF | €280 |
| Bandwidth (laag verkeer) | €5-10 |
| **Totaal** | **~€335-400/maand** |

Front Door Premium is de grootste kost; voor staging/test kan Standard
(€35/maand) volstaan.

## 14. Open punten voor het dev-team

Twee kleine code-changes zijn nodig vóór go-live, met geschatte effort:

1. `lib/auth/msal.ts` — `ConfidentialClientApplication` met `clientSecret`
   vervangen door `WorkloadIdentityCredential` uit `@azure/identity` zodat
   we client-secrets volledig kwijt zijn. **~2u.**
2. Optionele Application-Insights-integratie in `lib/observability/`
   (nu enkel Sentry). Dezelfde pattern: dynamic import, no-op zonder
   connection-string. **~2u.**

## 15. Hand-off checklist

Bij oplevering aan dev-team verwachten we:

- [ ] Resources aangemaakt en getagged
- [ ] Managed Identity object-id gedeeld
- [ ] App Registration aangemaakt door UA-IT (samen met PP-consultant)
- [ ] Federated Credential geconfigureerd
- [ ] Key Vault secrets aangemaakt, MI heeft `Key Vault Secrets User`
- [ ] Container Registry beschikbaar, MI heeft `AcrPull`
- [ ] Initial image gebouwd + gepushed met "hello world" placeholder
- [ ] Application Insights connection-string gedeeld
- [ ] Front Door endpoint URL gedeeld (vóór custom domain)
- [ ] Custom domain + TLS klaar
- [ ] GitHub Actions deploy workflow getest

## 16. Contact

- Dev-team lead: <vul-in>
- UA-IT (App Registration): <vul-in>
- Power Platform consultant: <vul-in>
- Repo: <vul-in>
