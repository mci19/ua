import { Badge } from "@/components/ui/badge";
import { presentStatus } from "@/lib/constants/statuses";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const { label, variant } = presentStatus(status);
  return <Badge variant={variant}>{label}</Badge>;
}
