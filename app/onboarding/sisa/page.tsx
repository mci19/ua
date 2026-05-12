import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { DescriptionList, type DescriptionItem } from "@/components/ui/description-list";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { requireStudent } from "@/lib/server/me";
import { SisaGrantForm } from "./SisaGrantForm";
import { formatDateTime } from "@/lib/utils/date";
import { safeRedirectPath } from "@/lib/utils/safeUrl";

export const dynamic = "force-dynamic";

export default async function SisaGrantPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const t = await getTranslations("sisa");
  const tStudent = await getTranslations("studentDetails");
  const { student } = await requireStudent();
  const { returnTo } = await searchParams;
  const items: DescriptionItem[] = [
    {
      term: tStudent("name"),
      description: `${student.firstname ?? ""} ${student.lastname ?? ""}`.trim(),
    },
    { term: tStudent("studentNumber"), description: student.ua_studentnumber },
    {
      term: t("lastGrant"),
      description: student.ua_sisarequestgrantedon
        ? formatDateTime(student.ua_sisarequestgrantedon)
        : t("notYetGranted"),
      fullWidth: true,
    },
  ];
  return (
    <>
      <Topbar title={t("topbarTitle")} showBack rightSlot={<SignOutForm />} />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">
            <Stack gap="lg">
              <Stack gap="xs">
                <Heading level="header">{t("title")}</Heading>
                <Text tone="muted">{t("intro")}</Text>
              </Stack>
              <DescriptionList items={items} />
              <SisaGrantForm returnTo={safeRedirectPath(returnTo, "/aanvragen/nieuw")} />
            </Stack>
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}
