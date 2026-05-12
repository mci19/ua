import { getTranslations } from "next-intl/server";

export async function SkipLink() {
  const t = await getTranslations("common");
  return (
    <a href="#main" className="ua-skip-link">
      {t("skipToContent")}
    </a>
  );
}
