import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { FILE_TYPE_CODE } from "@/lib/constants/dossierTypes";
import { routes } from "@/lib/constants/routes";

const scenarios = [
  {
    code: FILE_TYPE_CODE.STUDIETOELAGE_TOEGEKEND,
    href: `/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.STUDIETOELAGE_TOEGEKEND}`,
  },
  {
    code: FILE_TYPE_CODE.LEEFLOON,
    href: `/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.LEEFLOON}`,
  },
  {
    code: FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT,
    href: routes.newSocialAllowanceOther,
  },
] as const;

export default async function SocialAllowancePickerPage() {
  const t = await getTranslations("socialAllowance");
  const tFiletypes = await getTranslations("filetypes");
  const tCommon = await getTranslations("common");
  return (
    <>
      <Topbar
        title={t("topbarTitle")}
        showBack
        backHref={routes.newRequest}
        rightSlot={<SignOutForm />}
      />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
          <Stack as="ul" gap="sm">
            {scenarios.map(({ code, href }) => (
              <li key={code}>
                <Button asChild intent="primary" size="lg" className="w-full justify-between">
                  <Link href={href}>
                    <span className="text-left">{tFiletypes(code)}</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            ))}
          </Stack>
          <Button asChild intent="subtle" size="md" className="self-start">
            <Link href={routes.newRequest}>{tCommon("cancel")}</Link>
          </Button>
        </Stack>
      </PageShell>
    </>
  );
}
