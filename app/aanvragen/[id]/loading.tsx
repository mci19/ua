import { getTranslations } from "next-intl/server";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default async function Loading() {
  const t = await getTranslations("errors");
  return (
    <div className="container py-10">
      <LoadingSpinner label={t("loadingDossier")} />
    </div>
  );
}
