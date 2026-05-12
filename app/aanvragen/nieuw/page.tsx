import { redirect } from "next/navigation";
import { FileText, Banknote, FileSignature, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { ActionCard } from "@/components/ui/action-card";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { routes } from "@/lib/constants/routes";
import { requireStudent } from "@/lib/server/me";

export const dynamic = "force-dynamic";

interface Choice {
  href: string;
  icon: LucideIcon;
  titleKey: "social" | "advance" | "powerOfAttorney";
  descKey: "socialDesc" | "advanceDesc" | "powerOfAttorneyDesc";
  intent: "primary" | "secondary";
}

const choices: Choice[] = [
  {
    href: routes.newSocialAllowance,
    icon: Banknote,
    titleKey: "social",
    descKey: "socialDesc",
    intent: "primary",
  },
  {
    href: "/aanvragen/nieuw/voorschot",
    icon: FileText,
    titleKey: "advance",
    descKey: "advanceDesc",
    intent: "primary",
  },
  {
    href: "/aanvragen/nieuw/volmacht",
    icon: FileSignature,
    titleKey: "powerOfAttorney",
    descKey: "powerOfAttorneyDesc",
    intent: "secondary",
  },
];

export default async function NewRequestTypePage() {
  const t = await getTranslations("requestType");
  const { student } = await requireStudent();
  if (!student.ua_sisarequestgranted) {
    redirect(`${routes.sisaGrant}?returnTo=${encodeURIComponent(routes.newRequest)}`);
  }
  return (
    <>
      <Topbar
        title={t("topbarTitle")}
        showBack
        backHref={routes.overview}
        rightSlot={<SignOutForm />}
      />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {choices.map(({ href, icon, titleKey, descKey, intent }) => (
              <ActionCard
                key={href}
                href={href}
                icon={icon}
                intent={intent}
                title={t(titleKey)}
                description={t(descKey)}
              />
            ))}
          </div>
        </Stack>
      </PageShell>
    </>
  );
}
