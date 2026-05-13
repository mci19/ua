# Opdracht — Power Platform-configuratie voor "Aanvraag toelagen"

**Doel**: Dataverse, Power Automate en SharePoint correct configureren
zodat de nieuwe Next.js-portal `Aanvraag toelagen` kan inloggen, lezen,
schrijven en uploaden tegen jullie Dataverse-omgeving — zónder dat
studenten een Power Apps-licentie nodig hebben.

**Tijdslijn**: indicatief 1-2 werkdagen, afhankelijk van of de UA-solution
al geïmporteerd is.

**Context — wat is er anders dan vroeger?**

- De canvas-app is vervangen door een Next.js-portal die direct met
  Dataverse Web API + Microsoft Graph praat.
- De portal authenticeert tegen Dataverse als **Application User**
  (service-principal, client-credentials flow). Studenten hebben dus
  enkel een M365 A3/A5-licentie nodig, geen Power Apps Premium.
- Voor SharePoint-uploads gebruikt de portal de identiteit van de student
  (delegated Graph, OBO-flow). Audit-trail in SP blijft per-student.
- Power Automate-flows blijven hun werk doen (status-sync, e-mail,
  herinneringen, EBS/Komida-postings) en hoeven niet aangepast voor de
  portal-rebuild — alleen connecties moeten goed staan.

---

## 1. Solution-import

In Power Platform admin center → jullie environment:

1. Import `ua_base` (managed of unmanaged volgens UA's gangbare praktijk).
2. Import `ua_logic` ná `ua_base`.
3. Publish All Customizations.

Controleer dat alle entities zichtbaar zijn:

- `ua_request`, `ua_comment` (Activity), `ua_document`,
  `ua_filetype`, `ua_filedocument`, `ua_documentconfiguration`,
  `ua_filesubtype`, `ua_academicyear`
- Plus OOTB: `contact`, `annotation`, `sharepointdocumentlocation`

Validatie: open `/api/data/v9.2/$metadata` in de browser (met een
authenticatie-tool) en verifieer dat de entity-sets `ua_requests`,
`ua_comments`, `ua_documents`, `ua_filetypes`, `ua_filedocuments`,
`ua_documentconfigurations` aanwezig zijn.

## 2. Reference-data — vereist voor de portal

De portal verwacht een **vaste lijst codes** in `ua_filetype.ua_id`.
Controleer of deze records bestaan; zo niet, seed ze:

| `ua_id` (technische code) | `ua_name` (gebruiker ziet) |
|---|---|
| `ua_studietoelagetoegekend` | Sociale toelage – studietoelage toegekend |
| `ua_studietoelagenietontvangen` | Sociale toelage – studietoelage nog niet ontvangen |
| `ua_vermoedevantekort` | Sociale toelage – vermoeden van tekort |
| `ua_andersociaalfeitendossier` | Sociale toelage – ander sociaal feitendossier |
| `ua_voorschotstudietoelage` | Voorschot studietoelage |
| `ua_volmacht` | Volmacht |

Voor élk filetype:

- Eventueel een PDF-template uploaden als `annotation` (note) op de
  filetype-row. De portal gebruikt deze voor de download-knop bij
  voorschot en volmacht. Mimetype **moet** `application/pdf` zijn.

## 3. Required-documents matrix

Per filetype bepaal je welke documenten verplicht / optioneel zijn via
`ua_documentconfiguration` records:

```
ua_documentconfiguration:
  _ua_dossiertypeid_value      → ua_filetype
  _ua_documentid_value         → ua_filedocument
  ua_isrequired                → bool (true = verplicht)
  ua_isivt                     → bool (true = "is van toepassing"; bij
                                       false toont de portal "N.v.t."-toggle)
```

Concrete records die je minstens nodig hebt voor sociale-toelage:

- Inkomstattest ouders
- Studievoortgang attest
- Bewijs van inschrijving
- (...andere conform UA-praktijk)

Zonder deze rows toont de Documenten-stap een lege checklist en kan de
student geen aanvraag indienen.

## 4. Application User aanmaken (cruciaal)

De portal **bestaat** voor Dataverse als één Application User. Deze gaat
namens elke ingelogde student calls doen.

1. Vraag bij UA-IT / Azure-team:
   - **Application (Client) ID** van de Entra-app-registration
     `UA Aanvraag toelagen`. Geef deze app de application-permission
     `Dynamics CRM user_impersonation` met admin-consent.

2. In Power Platform admin center → environment → Settings → Users +
   permissions → **Application users** → **+ New app user**:
   - Klik **Add an app** → selecteer de Entra-app uit stap 1.
   - **Business unit**: root (`<environment-name>`).
   - **Security roles**: zie sectie 5.

3. Bewaar het systemuser-id dat aangemaakt wordt. De portal cachet dit
   bij eerste WhoAmI-call en gebruikt het om student-comments van
   staff-comments te onderscheiden (zie sectie 7).

## 5. Security role voor de Application User

Maak een custom rol aan: **"UA Studentenportaal — App User"**.

Vereiste permissies (org-level tenzij anders vermeld):

| Entity | Create | Read | Write | Delete | Append | AppendTo |
|---|---|---|---|---|---|---|
| Contact | — | Org | User (= eigen contact-record patchen voor SISA-grant) | — | Org | Org |
| ua_filetype | — | Org | — | — | — | Org |
| ua_filedocument | — | Org | — | — | — | Org |
| ua_documentconfiguration | — | Org | — | — | — | — |
| ua_request | Org | Org | Org | — | Org | Org |
| ua_comment | Org | Org | Org | — | Org | Org |
| ua_document | Org | Org | Org | Org | Org | Org |
| sharepointdocumentlocation | — | Org | — | — | — | — |
| annotation | — | Org | — | — | — | — |
| systemuser | — | Org | — | — | — | — |

**Belangrijk** — zonder Read op `systemuser` faalt de WhoAmI-call die de
portal nodig heeft om de App User's eigen systemuser-id te kennen.

Voor het eerste smoke-test (om snel te verifiëren of het patroon werkt):
geef tijdelijk **System Customizer** of zelfs **System Administrator**;
verfijn naar bovenstaande matrix vóór live-gang.

## 6. Test-contacts seeden

Maak in `Contact` minstens twee test-records:

| firstname | lastname | emailaddress1 | ua_useremail | ua_studentnumber | ua_sisarequestgranted |
|---|---|---|---|---|---|
| Anna | Janssens | anna.test@<jullie-tenant>.onmicrosoft.com | anna.test@... | s9999001 | false |
| Tom | Peeters | tom.test@... | tom.test@... | s9999002 | true |

Belangrijk:

- De **email** in `ua_useremail` of `emailaddress1` moet **exact** matchen
  met de UPN van het test-M365-account waarmee je inlogt. De portal doet
  een `tolower()`-vergelijking op beide velden.
- Als geen contact gevonden wordt → portal redirect naar
  `/onboarding/unknown` ("we kennen je niet"). Dat is correct gedrag,
  maar dan kun je niets testen.
- Een derde testaccount **zonder** contact-row is nuttig om de
  unknown-user-flow te testen.

## 7. Power Automate flows in `ua_logic`

Na import staan deze flows mogelijk uitgeschakeld met **broken
connections** (ze wijzen naar UA's connecties of zijn nieuw aangemaakt).

### 7.1. Connecties remappen

Voor elke flow in `ua_logic`:

1. Open de flow → **Connections**-paneel rechts.
2. Voor elke "x" / waarschuwing → **+ Add new connection**:
   - **Microsoft Dataverse**: maak nieuwe connectie aan namens een
     service-account (niet jouw eigen UA-account — anders breekt het zodra
     jij vertrekt). Suggestie: maak een dedicated `svc-pa-aanvragen@`
     account aan.
   - **Office 365 Outlook**: idem, service-account.
   - **SharePoint**: idem, gekoppeld aan jullie test-SP-site.

3. Sla op + **Turn on** voor de flows die je wil testen.

### 7.2. Volgorde van inschakelen voor smoke-tests

Niet alle flows tegelijk aanzetten. Volgorde:

1. **`Aanvraag-SyncDVtoSP`** — maakt SharePoint-folder aan bij elke nieuwe
   `ua_request`. Zonder deze flow werkt document-upload niet (er is geen
   `sharepointdocumentlocation`-row).

2. **`DocumentLibrary-SyncAttachmenttoDV`** — spiegelt SP-uploads terug
   naar `ua_document`-rows. Zonder deze flow ziet de model-driven-app de
   uploads niet.

3. **`Aanvraag-Submitted`** + **`Comment-newcommentsendnotification`** —
   e-mail notificaties. Optioneel voor de portal-functionaliteit; aan
   te zetten voor end-to-end test.

4. De rest (EBS, Komida, betaalherinneringen) → enkel aanzetten als je
   die specifieke integraties wil meetesten.

### 7.3. Hardcoded URL's in flows controleren

Sommige flows hebben een gehard-codeerde SharePoint site/library URL.
Zoek per flow naar acties met "Site Address" of "Library Name" — pas
aan naar **jullie test-SP-site**.

Specifiek `Aanvraag-SyncDVtoSP`: deze maakt folders aan op een SP-pad
gebaseerd op `ua_filenumber`. Controleer dat het pad past binnen jullie
library "Aanvragen" en niet naar een UA-only pad wijst.

## 8. SharePoint-setup

### 8.1. Site + library

Maak (of gebruik een bestaande) SharePoint communication site, met daarin
een document library met **exact** de naam waar de Power Automate flows
naar wijzen. Standaard: `Aanvragen`.

### 8.2. Permissions

- Membership: alle test-studenten moeten **Edit**-rechten hebben op de
  library (de portal upload delegated, namens de student).
- Voor de Power Automate flows: het service-account met de SP-connectie
  moet ook Edit hebben.

### 8.3. Site- en drive-id ophalen

Levert dit aan het Azure-team door (komen in `SHAREPOINT_SITE_ID` en
`SHAREPOINT_DRIVE_ID` env-vars):

```
GET https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/<sitename>?$select=id
→ SHAREPOINT_SITE_ID = "<host>,<site-guid>,<web-guid>"

GET https://graph.microsoft.com/v1.0/sites/<site-id>/drives
→ SHAREPOINT_DRIVE_ID = id van de "Aanvragen"-library
```

Beide via Graph Explorer (graphexplorer.azurewebsites.net) of Postman.

## 9. Dataverse environment variables

Sommige van UA's flows gebruiken environment-variabelen voor URL's,
zoals de portal-URL voor e-mail-deeplinks. Zoek in
**Solutions → ua_logic → Environment variables** naar variabelen die
opnieuw moeten worden gezet (typisch: SP-URL, portal-URL, support-mail).

## 10. End-to-end-validatie

Na complete configuratie loop je dit door samen met het dev-team:

| # | Stap | Verwacht resultaat |
|---|---|---|
| 1 | `/api/health?deep=1` (Azure-team trigger) | `downstream.dataverse.ok=true`, `downstream.graph.ok=true` |
| 2 | Browser login als Anna (test-account) | Redirect naar Entra → terug op `/` |
| 3 | Overview toont "Welkom Anna" + 0 aanvragen | OK |
| 4 | "Aanvraag starten" → SISA-consent geven | `contact.ua_sisarequestgranted = true` zichtbaar in Dataverse |
| 5 | Sociale toelage → scenario kiezen → formulier invullen → opslaan | Nieuwe `ua_request` met statuscode "In Aanmaak" |
| 6 | Documenten-checklist → één doc op "N.v.t." zetten | `ua_document`-row met `ua_isnotapplicable=true` |
| 7 | Documenten-checklist → één PDF uploaden | Bestand in SP `/Aanvragen/<filenumber>/`, `ua_document`-row aangemaakt door `DocumentLibrary-SyncAttachmenttoDV`-flow |
| 8 | "Indienen" knop | `ua_request.statuscode = "In Wacht"` |
| 9 | `Aanvraag-Submitted`-flow getriggerd | E-mail bevestiging verzonden (check Sent items van het service-account) |
| 10 | Berichten-tab → bericht plaatsen | `ua_comment`-row met `_createdby_value = AppUser systemuser id` |
| 11 | Staff opent ua_request in model-driven app, plaatst comment | In portal verschijnt die comment met label "Dossierbeheerder" (terwijl student-comment label "Student" heeft) |

## 11. Mogelijke struikelpunten

| Symptoom | Oorzaak | Fix |
|---|---|---|
| Alle Dataverse-calls 401 | Application User niet gekoppeld of disabled | Check Application Users-lijst, status "Enabled" |
| Specifieke entity 403 | Security-role mist permissie op die entity | Sectie 5 — verfijn rol |
| Comments staan alle als "Dossierbeheerder" | `getAppUserSystemUserId()` faalt (geen Read op systemuser) | Sectie 5 — Read op systemuser toevoegen |
| `/onboarding/unknown` ondanks bestaand contact | Email-mismatch tussen M365-login en `ua_useremail`/`emailaddress1` | Update contact zodat email **exact** matcht (case-insensitive) |
| Upload werkt maar verschijnt niet in `ua_document` | `DocumentLibrary-SyncAttachmenttoDV`-flow uit of broken | Inschakelen + connecties checken |
| Folder-pad SP klopt niet | Hardcoded UA-pad in `Aanvraag-SyncDVtoSP` | Sectie 7.3 |
| 400 op comment-create | `ua_requestid` of `regardingobjectid` lookup-naam wijkt af | Power Platform-consultant verifieert in `customizations.xml` van eigen tenant; portal-team past binding aan |

## 12. Hand-off checklist

Wat we van jullie verwachten bij oplevering:

- [ ] Solution `ua_base` + `ua_logic` geïmporteerd en gepublished
- [ ] Reference data `ua_filetype` (6 rows) geseeded met correcte `ua_id` codes
- [ ] `ua_filedocument` + `ua_documentconfiguration` records aanwezig
- [ ] Application User aangemaakt en gekoppeld aan Entra-app
- [ ] Security role aangemaakt en toegekend
- [ ] SystemUser-id van de App User gedeeld met dev-team
- [ ] Test-Contacts geseeded (min. 2, max-3 inclusief unknown-user)
- [ ] SharePoint site + library aanwezig + permissions gezet
- [ ] `SHAREPOINT_SITE_ID` + `SHAREPOINT_DRIVE_ID` gedeeld met Azure-team
- [ ] Power Automate connecties remapped, flows die we testen aangezet
- [ ] Environment variables in `ua_logic` aangepast aan test-tenant
- [ ] Alle 11 smoke-tests groen

## 13. Open vragen voor UA-besluit

Een paar functionele keuzes liggen nog open:

1. **Welke flows uit `ua_logic` actief op test-omgeving?** — sommige
   schrijven naar EBS/Komida en kosten externe API-calls. Standaard
   uitzetten?
2. **Welke staff-users hebben Dynamics 365-licentie voor de model-
   driven app?** — bepaalt of staff-comment-detectie via "createdby ≠
   AppUser" werkt zoals ontworpen, of dat er overhead zit (e.g. PA-flow
   die ook comments maakt).
3. **Naming-conventie voor service-accounts** voor Power Automate
   connecties — kiest UA-IT samen met security-team.

## 14. Contact

- Power Platform consultant: <vul-in>
- Dev-team lead: <vul-in>
- UA-IT (App Registration): <vul-in>
- Azure-team: <vul-in>
- Repo (voor portal-code reference): <vul-in>
