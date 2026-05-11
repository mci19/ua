export const REQUEST_STATUS = {
  IN_AANMAAK: "In Aanmaak",
  IN_WACHT: "In wacht",
  IN_BEHANDELING: "In behandeling",
  GOEDGEKEURD: "Goedgekeurd",
  GEWEIGERD: "Geweigerd",
  GEANNULEERD: "Geannuleerd",
} as const;

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const REQUEST_SUBSTATUS = {
  ACTIE_VEREIST: "Actie vereist",
} as const;

export type RequestSubStatus = (typeof REQUEST_SUBSTATUS)[keyof typeof REQUEST_SUBSTATUS];

export interface StatusPresentation {
  label: string;
  variant: "neutral" | "info" | "success" | "danger" | "warning";
}

export function presentStatus(status: string | null | undefined): StatusPresentation {
  switch (status) {
    case REQUEST_STATUS.IN_AANMAAK:
      return { label: "In aanmaak", variant: "neutral" };
    case REQUEST_STATUS.IN_WACHT:
    case REQUEST_STATUS.IN_BEHANDELING:
      return { label: "In behandeling", variant: "info" };
    case REQUEST_STATUS.GOEDGEKEURD:
      return { label: "Goedgekeurd", variant: "success" };
    case REQUEST_STATUS.GEWEIGERD:
      return { label: "Geweigerd", variant: "danger" };
    case REQUEST_STATUS.GEANNULEERD:
      return { label: "Geannuleerd", variant: "neutral" };
    default:
      return { label: status ?? "Onbekend", variant: "neutral" };
  }
}
