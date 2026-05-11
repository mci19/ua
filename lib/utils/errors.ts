export class ApiError extends Error {
  status: number;
  code?: string;
  dutchMessage?: string;
  constructor(status: number, message: string, opts: { code?: string; dutchMessage?: string } = {}) {
    super(message);
    this.status = status;
    this.code = opts.code;
    this.dutchMessage = opts.dutchMessage;
  }
}

const DUTCH_BY_STATUS: Record<number, string> = {
  400: "De ingediende gegevens zijn ongeldig.",
  401: "Je bent niet (meer) aangemeld. Meld je opnieuw aan.",
  403: "Je hebt geen toegang tot dit dossier.",
  404: "Niet gevonden.",
  409: "Er bestaat al een dossier van dit type. Open je bestaande aanvraag.",
  413: "Het bestand is te groot.",
  415: "Dit bestandstype wordt niet ondersteund.",
  429: "Te veel verzoeken. Probeer het binnen enkele seconden opnieuw.",
  500: "Er ging iets mis aan onze kant. Probeer het later opnieuw.",
  503: "Het systeem is tijdelijk niet bereikbaar.",
};

export function dutchMessageForError(err: unknown): string {
  if (err instanceof ApiError && err.dutchMessage) return err.dutchMessage;
  if (err instanceof ApiError) return DUTCH_BY_STATUS[err.status] ?? err.message;
  return "Er ging iets mis. Probeer het opnieuw of contacteer de beheerder.";
}

export interface DataverseErrorBody {
  error?: { code?: string; message?: string };
}

export async function toApiErrorFromDataverse(res: Response): Promise<ApiError> {
  let body: DataverseErrorBody | null = null;
  try {
    body = (await res.json()) as DataverseErrorBody;
  } catch {
    // swallow
  }
  const code = body?.error?.code;
  const message = body?.error?.message ?? res.statusText;
  let dutch: string | undefined = DUTCH_BY_STATUS[res.status];
  if (code === "0x80040220") dutch = "Je hebt geen toegang tot dit dossier.";
  if (code === "0x80048408") dutch = "De ingediende gegevens zijn ongeldig.";
  return new ApiError(res.status, message, { code, dutchMessage: dutch });
}
