import { Compass, FileText, MessageCircle, Upload, type LucideIcon } from "lucide-react";

// Wizard steps are defined by id + icon here; the human-readable title
// comes from i18n at render time. Icons are React component references
// (functions) — fine on the server, but the rendering component must
// stay a Server Component (no "use client" allowed; would fail at the
// RSC boundary because functions aren't serialisable).
export interface WizardStepDef {
  id: "aanvraag" | "formulier" | "documenten" | "berichten";
  icon: LucideIcon;
}

export const wizardSteps: WizardStepDef[] = [
  { id: "aanvraag", icon: Compass },
  { id: "formulier", icon: FileText },
  { id: "documenten", icon: Upload },
  { id: "berichten", icon: MessageCircle },
];
