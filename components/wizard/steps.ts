import { Compass, FileText, Upload, MessageCircle } from "lucide-react";
import type { TimelineStep } from "@/components/common/ProgressTimeline";

export const wizardSteps: TimelineStep[] = [
  { id: "aanvraag", title: "Aanvraag", icon: Compass },
  { id: "formulier", title: "Formulier", icon: FileText },
  { id: "documenten", title: "Document opladen", icon: Upload },
  { id: "berichten", title: "Berichten", icon: MessageCircle },
];
