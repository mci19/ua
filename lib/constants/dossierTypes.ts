// Verified against canvas YAML at /tmp/ua-analysis/canvas_app/Src/scr_*.pa.yaml.
// In the original, "Sociale toelage" is not a single filetype; each scenario IS a
// filetype with its own ua_id. The new app preserves that 1:1 mapping.

export const FILE_TYPE_CODE = {
  // Sociale toelage scenarios
  STUDIETOELAGE_TOEGEKEND: "ua_studietoelagetoegekend",
  STUDIETOELAGE_NIET_ONTVANGEN: "ua_studietoelagenietontvangen",
  LEEFLOON: "ua_leefloon",
  VERMOEDE_VAN_TEKORT: "ua_vermoedevantekort",
  // Voorschot
  VOORSCHOT_STUDIETOELAGE: "ua_voorschotstudietoelage",
  // Volmacht
  VERLENEN_VAN_VOLMACHT: "ua_verlenenvanvolmacht",
} as const;

export type FileTypeCode = (typeof FILE_TYPE_CODE)[keyof typeof FILE_TYPE_CODE];

export const SOCIAL_ALLOWANCE_SCENARIOS = [
  FILE_TYPE_CODE.STUDIETOELAGE_TOEGEKEND,
  FILE_TYPE_CODE.STUDIETOELAGE_NIET_ONTVANGEN,
  FILE_TYPE_CODE.LEEFLOON,
  FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT,
] as const;

export const FILE_TYPE_LABEL_NL: Record<FileTypeCode, string> = {
  ua_studietoelagetoegekend:
    "Ik heb mijn goedgekeurde studietoelage ontvangen voor dit academiejaar.",
  ua_studietoelagenietontvangen: "Ik heb nog geen bevestiging van mijn studietoelage.",
  ua_leefloon: "Ik ontvang een recent leefloon en ben alleenstaand.",
  ua_vermoedevantekort:
    "Ik val niet onder bovenstaande en wens een sociale toelage aan te vragen.",
  ua_voorschotstudietoelage: "Aanvraag voorschot studietoelage",
  ua_verlenenvanvolmacht: "Verlenen van volmacht",
};

export const REQUEST_TYPE_CATEGORY = {
  SOCIAL_ALLOWANCE: "social-allowance",
  ADVANCE: "advance",
  POWER_OF_ATTORNEY: "power-of-attorney",
} as const;

export type RequestTypeCategory =
  (typeof REQUEST_TYPE_CATEGORY)[keyof typeof REQUEST_TYPE_CATEGORY];

export function categoryFor(code: FileTypeCode): RequestTypeCategory {
  if (code === FILE_TYPE_CODE.VOORSCHOT_STUDIETOELAGE) return REQUEST_TYPE_CATEGORY.ADVANCE;
  if (code === FILE_TYPE_CODE.VERLENEN_VAN_VOLMACHT)
    return REQUEST_TYPE_CATEGORY.POWER_OF_ATTORNEY;
  return REQUEST_TYPE_CATEGORY.SOCIAL_ALLOWANCE;
}

export const CATEGORY_LABEL_NL: Record<RequestTypeCategory, string> = {
  "social-allowance": "Aanvraag sociale toelage",
  advance: "Aanvraag voorschot studietoelage",
  "power-of-attorney": "Verlenen van volmacht",
};

export const CATEGORY_DESCRIPTION_NL: Record<RequestTypeCategory, string> = {
  "social-allowance":
    "Een financiële tegemoetkoming als je tijdelijk moeilijk rondkomt en geen of een onvoldoende studietoelage ontvangt.",
  advance:
    "Een voorschot in afwachting van je goedgekeurde studietoelage van de Vlaamse overheid.",
  "power-of-attorney":
    "Geef iemand de toestemming om je studentenadministratie in jouw plaats op te volgen.",
};
