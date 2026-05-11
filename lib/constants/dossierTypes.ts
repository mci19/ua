export const DOSSIER_TYPE_ID = {
  SOCIALE_TOELAGE: "ua_socialetoelage",
  VOORSCHOT_STUDIETOELAGE: "ua_voorschotstudietoelage",
  VERLENEN_VAN_VOLMACHT: "ua_verlenenvanvolmacht",
} as const;

export type DossierTypeId = (typeof DOSSIER_TYPE_ID)[keyof typeof DOSSIER_TYPE_ID];

export const DOSSIER_SUBTYPE_ID = {
  STUDIETOELAGE_TOEGEKEND: "ua_studietoelagetoegekend",
  STUDIETOELAGE_NIET_ONTVANGEN: "ua_studietoelagenietontvangen",
  LEEFLOON: "ua_leefloon",
  VERMOEDE_VAN_TEKORT: "ua_vermoedevantekort",
} as const;

export type DossierSubtypeId = (typeof DOSSIER_SUBTYPE_ID)[keyof typeof DOSSIER_SUBTYPE_ID];

export const DOSSIER_TYPE_LABEL_NL: Record<DossierTypeId, string> = {
  ua_socialetoelage: "Aanvraag sociale toelage",
  ua_voorschotstudietoelage: "Aanvraag voorschot studietoelage",
  ua_verlenenvanvolmacht: "Verlenen van volmacht",
};

export const DOSSIER_TYPE_DESCRIPTION_NL: Record<DossierTypeId, string> = {
  ua_socialetoelage:
    "Een financiële tegemoetkoming als je tijdelijk moeilijk rondkomt en geen of een onvoldoende studietoelage ontvangt.",
  ua_voorschotstudietoelage:
    "Een voorschot in afwachting van je goedgekeurde studietoelage van de Vlaamse overheid.",
  ua_verlenenvanvolmacht:
    "Geef iemand de toestemming om je studentenadministratie in jouw plaats op te volgen.",
};

export const DOSSIER_SUBTYPE_LABEL_NL: Record<DossierSubtypeId, string> = {
  ua_studietoelagetoegekend:
    "Ik heb mijn goedgekeurde studietoelage ontvangen voor dit academiejaar.",
  ua_studietoelagenietontvangen: "Ik heb nog geen bevestiging van mijn studietoelage.",
  ua_leefloon: "Ik ontvang een recent leefloon en ben alleenstaand.",
  ua_vermoedevantekort:
    "Ik val niet onder bovenstaande en wens een sociale toelage aan te vragen.",
};
