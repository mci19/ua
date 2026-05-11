// statuscode (Active state, integer optionset values from ua_request_statuscode)
// Verified against /tmp/ua-analysis/ua_base/customizations.xml ua_request_statuscode optionset.
export const REQUEST_STATUS_CODE = {
  IN_AANMAAK: 1,
  IN_WACHT: 127000008,
  INGEDIEND: 127000006,
  IN_BEHANDELING: 127000007,
  VERWERKT: 127000002,
  BEOORDEELD_POSITIEF: 127000003,
  BEOORDEELD_NEGATIEF: 127000004,
  BEOORDEELD_HERZIENING: 127000005,
} as const;

export type RequestStatusCode = (typeof REQUEST_STATUS_CODE)[keyof typeof REQUEST_STATUS_CODE];

// ua_substatuscode (integer optionset from ua_substatus global optionset)
export const REQUEST_SUBSTATUS_CODE = {
  ACTIE_VEREIST: 127000000,
  AANGEPAST: 127000001,
} as const;

export type RequestSubStatusCode = (typeof REQUEST_SUBSTATUS_CODE)[keyof typeof REQUEST_SUBSTATUS_CODE];

export interface StatusPresentation {
  label: string;
  variant: "neutral" | "info" | "success" | "danger" | "warning";
}

export function presentStatus(code: number | null | undefined): StatusPresentation {
  switch (code) {
    case REQUEST_STATUS_CODE.IN_AANMAAK:
      return { label: "In aanmaak", variant: "neutral" };
    case REQUEST_STATUS_CODE.IN_WACHT:
      return { label: "In wacht", variant: "info" };
    case REQUEST_STATUS_CODE.INGEDIEND:
      return { label: "Ingediend", variant: "info" };
    case REQUEST_STATUS_CODE.IN_BEHANDELING:
      return { label: "In behandeling", variant: "info" };
    case REQUEST_STATUS_CODE.VERWERKT:
      return { label: "Verwerkt", variant: "success" };
    case REQUEST_STATUS_CODE.BEOORDEELD_POSITIEF:
      return { label: "Goedgekeurd", variant: "success" };
    case REQUEST_STATUS_CODE.BEOORDEELD_NEGATIEF:
      return { label: "Geweigerd", variant: "danger" };
    case REQUEST_STATUS_CODE.BEOORDEELD_HERZIENING:
      return { label: "Herziening", variant: "warning" };
    case null:
    case undefined:
      return { label: "Onbekend", variant: "neutral" };
    default:
      return { label: `Status ${code}`, variant: "neutral" };
  }
}

export function isEditable(statusCode: number | null | undefined): boolean {
  return statusCode === REQUEST_STATUS_CODE.IN_AANMAAK;
}

export function isActionRequired(substatusCode: number | null | undefined): boolean {
  return substatusCode === REQUEST_SUBSTATUS_CODE.ACTIE_VEREIST;
}
