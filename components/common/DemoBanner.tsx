import { getTranslations } from "next-intl/server";
import { isDemoMode } from "@/lib/demo/flag";

export async function DemoBanner() {
  if (!isDemoMode) return null;
  const t = await getTranslations("common");
  return (
    <div
      role="note"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-center text-small text-warning"
    >
      <span aria-hidden="true">⚠</span>
      <span className="font-medium">{t("demoBanner")}</span>
    </div>
  );
}
