import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { requireStudent } from "@/lib/server/me";
import { SisaGrantForm } from "./SisaGrantForm";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function SisaGrantPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { student } = await requireStudent();
  const { returnTo } = await searchParams;
  return (
    <>
      <Topbar title="Toestemming SISA" showBack rightSlot={<SignOutButton />} />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <CardTitle>Toestemming verlenen</CardTitle>
              <CardDescription>
                Om je aanvraag te kunnen behandelen, halen we je actuele gegevens op
                bij SISA. Geef hiervoor eenmalig per academiejaar je toestemming.
              </CardDescription>
            </div>
            <dl className="grid gap-3 text-label sm:grid-cols-2">
              <div>
                <dt className="text-small text-muted-foreground">Naam</dt>
                <dd className="font-semibold text-ua-navy">
                  {student.firstname} {student.lastname}
                </dd>
              </div>
              <div>
                <dt className="text-small text-muted-foreground">Studentnummer</dt>
                <dd>{student.ua_studentnumber ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-small text-muted-foreground">
                  Laatste toestemming
                </dt>
                <dd>
                  {student.ua_sisarequestgrantedon
                    ? formatDateTime(student.ua_sisarequestgrantedon)
                    : "Nog niet verleend"}
                </dd>
              </div>
            </dl>
            <SisaGrantForm returnTo={returnTo ?? "/aanvragen/nieuw"} />
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}
