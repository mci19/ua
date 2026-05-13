# Opdracht — Azure-hosting voor "Aanvraag toelagen"

**Doel**: De Next.js-portal hosten op Azure. Minimale setup; uitbreiden
kan later.

**Architectuur**: één Azure Container App in West Europe, image uit
Azure Container Registry, geheimen als Container-App-secrets. Een
System-Assigned Managed Identity haalt later de client-secret weg
(zie sectie 6).

---

## 1. Resources

Eén resource group `rg-ua-aanvragen-prod` in **West Europe** (zelfde
regio als Dataverse `crm4`):

| Resource | Type | SKU |
|---|---|---|
| `acruaaanvragenprod` | Container Registry | Basic |
| `cae-ua-aanvragen` | Container Apps Environment | Consumption |
| `ca-ua-aanvragen` | Container App | 0.5 vCPU / 1 GiB, min 1 / max 2 replicas |

Log Analytics workspace wordt automatisch aangemaakt bij Container Apps
Environment — geen aparte actie.

## 2. Aanmaken

```bash
RG=rg-ua-aanvragen-prod
LOC=westeurope

az group create -n $RG -l $LOC

az acr create -g $RG -n acruaaanvragenprod --sku Basic

az containerapp env create -g $RG -n cae-ua-aanvragen -l $LOC

# Initial image moet bestaan vóór 'containerapp create'. Build vanuit repo:
az acr build -t ua-aanvragen:initial -r acruaaanvragenprod .

az containerapp create -g $RG -n ca-ua-aanvragen \
  --environment cae-ua-aanvragen \
  --image acruaaanvragenprod.azurecr.io/ua-aanvragen:initial \
  --ingress external --target-port 3000 \
  --min-replicas 1 --max-replicas 2 \
  --cpu 0.5 --memory 1.0Gi \
  --system-assigned \
  --registry-server acruaaanvragenprod.azurecr.io \
  --registry-identity system
```

De repo heeft al een werkende `Dockerfile` (Next.js `standalone`-output).
Geen aanpassingen nodig.

## 3. Env-vars + secrets

De gevoelige waarden (`AUTH_SECRET`, `AZURE_AD_CLIENT_SECRET`) gaan in
Container-App secrets (encrypted at rest). De rest is plain env-var:

```bash
az containerapp secret set -g $RG -n ca-ua-aanvragen --secrets \
  auth-secret="$(openssl rand -base64 32)" \
  azure-ad-client-secret="<van-entra-app>"

az containerapp update -g $RG -n ca-ua-aanvragen \
  --set-env-vars \
    AUTH_SECRET=secretref:auth-secret \
    AZURE_AD_CLIENT_SECRET=secretref:azure-ad-client-secret \
    NEXTAUTH_URL=https://<container-app-fqdn-of-custom-domain> \
    AZURE_AD_TENANT_ID=<van-entra-app> \
    AZURE_AD_CLIENT_ID=<van-entra-app> \
    DATAVERSE_URL=https://<org>.crm4.dynamics.com \
    SHAREPOINT_SITE_ID=<host,site-guid,web-guid> \
    SHAREPOINT_DRIVE_ID=<drive-id> \
    SHAREPOINT_REQUEST_FOLDER=Aanvragen \
    NEXT_PUBLIC_APP_URL=https://<host> \
    LOG_LEVEL=info \
    UA_DEMO_MODE=false
```

De FQDN van de Container App krijg je met:

```bash
az containerapp show -g $RG -n ca-ua-aanvragen \
  --query properties.configuration.ingress.fqdn -o tsv
```

## 4. Custom domain (optioneel, kan na v1)

Container Apps ondersteunt custom domain + managed certificate
rechtstreeks — geen Front Door nodig:

```bash
az containerapp hostname add -g $RG -n ca-ua-aanvragen \
  --hostname aanvragen.uantwerpen.be

az containerapp hostname bind -g $RG -n ca-ua-aanvragen \
  --hostname aanvragen.uantwerpen.be \
  --environment cae-ua-aanvragen \
  --validation-method CNAME
```

UA-DNS-team zet CNAME naar de Container-App FQDN. Daarna:

- App Registration redirect URI bijwerken naar het custom domain.
- `NEXTAUTH_URL` env-var bijwerken.

## 5. Application User in Dataverse

De Power Platform-consultant levert dit (zie
[POWERPLATFORM-OPDRACHT.md](./POWERPLATFORM-OPDRACHT.md)). Wat het
infra-team moet weten:

- Entra App Registration `UA Aanvraag toelagen` moet bestaan in UA-tenant
  met admin-consent op `Dynamics CRM user_impersonation` (application).
- Application (Client) ID + Tenant ID + Client Secret → in de env-vars
  van de Container App (zie sectie 3).

## 6. Client-secret elimineren (fase 2, optioneel)

Op termijn willen we `AZURE_AD_CLIENT_SECRET` weghalen door de Managed
Identity te federeren naar de App Registration:

```bash
MI_PRINCIPAL_ID=$(az containerapp show -g $RG -n ca-ua-aanvragen \
  --query identity.principalId -o tsv)

az ad app federated-credential create \
  --id <app-registration-object-id> \
  --parameters "{
    \"name\": \"ca-ua-aanvragen\",
    \"issuer\": \"https://login.microsoftonline.com/<tenant-id>/v2.0\",
    \"subject\": \"system:managed-identity:$MI_PRINCIPAL_ID\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }"
```

Vereist een kleine code-change in `lib/auth/msal.ts`
(`ConfidentialClientApplication` → `WorkloadIdentityCredential` uit
`@azure/identity`, ~2u dev-werk). Tot dat in zit: gewoon de client-secret
in een Container-App-secret laten staan.

## 7. Deploy

Manueel voor v1:

```bash
az acr build -t ua-aanvragen:$(git rev-parse --short HEAD) \
  -r acruaaanvragenprod .

az containerapp update -g $RG -n ca-ua-aanvragen \
  --image acruaaanvragenprod.azurecr.io/ua-aanvragen:$(git rev-parse --short HEAD)
```

GitHub Actions workflow opzetten met OIDC kan later — geen prio voor v1.

## 8. Smoke-tests

| # | Test | Verwacht |
|---|---|---|
| 1 | `curl https://<fqdn>/api/health` | 200, `mode=production`, env-vars true |
| 2 | `curl https://<fqdn>/api/health?deep=1` | `downstream.dataverse.ok=true`, `downstream.graph.ok=true` |
| 3 | Browser login met test-account | Redirect Entra → terug op `/` |

Logs:

```bash
az containerapp logs show -g $RG -n ca-ua-aanvragen --follow
```

## 9. Kostenraming

Indicatief, EUR/maand, laag verkeer:

| Resource | Estimate |
|---|---|
| Container Apps (1 replica baseline + bursts) | €15-30 |
| Container Registry Basic | €5 |
| Log Analytics (1-2 GB) | €3-5 |
| **Totaal** | **~€25-40** |

## 10. Hand-off checklist

- [ ] Resources aangemaakt
- [ ] Initial image gebouwd + gepushed (mag een hello-world placeholder zijn)
- [ ] Container App draait + FQDN bereikbaar
- [ ] Secrets + env-vars gezet
- [ ] App Registration redirect URI bijgewerkt
- [ ] Smoke-test 1+2 groen
- [ ] FQDN + (later) custom domain gedeeld met dev- en Power Platform-team

## 11. Niet in scope voor v1 (kan later)

- Front Door / WAF
- Application Insights (Container Apps logs naar Log Analytics volstaat)
- Key Vault (Container-App secrets is voldoende voor één app)
- Private Endpoints / VNet integratie
- GitHub Actions CI/CD (manueel deployen werkt prima om te starten)
- Multi-region failover

## 12. Contact

- Dev-team: <vul-in>
- UA-IT (Entra app): <vul-in>
- Power Platform consultant: <vul-in>
- Repo: <vul-in>
