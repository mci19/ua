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

export const dynamic = "force-dynamic";

export default async function SisaGrantPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { student } = await requireStudent();
  const { returnTo } = await searchParams;
  const items: DescriptionItem[] = [
    {
      term: "Naam",
      description: `${student.firstname ?? ""} ${student.lastname ?? ""}`.trim(),
    },
    { term: "Studentnummer", description: student.ua_studentnumber },
    {
      term: "Laatste toestemming",
      description: student.ua_sisarequestgrantedon
        ? formatDateTime(student.ua_sisarequestgrantedon)
        : "Nog niet verleend",
      fullWidth: true,
    },
  ];
  return (
    <>
      <Topbar title="Toestemming SISA" showBack rightSlot={<SignOutForm />} />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">
            <Stack gap="lg">
              <Stack gap="xs">
                <Heading level="header">Toestemming verlenen</Heading>
                <Text tone="muted">
                  Om je aanvraag te kunnen behandelen halen we je actuele gegevens op
                  bij SISA. Geef hiervoor eenmalig per academiejaar je toestemming.
                </Text>
              </Stack>
              <DescriptionList items={items} />
              <SisaGrantForm returnTo={returnTo ?? "/aanvragen/nieuw"} />
            </Stack>
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}
