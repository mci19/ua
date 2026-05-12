import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { wizardSteps } from "@/components/wizard/steps";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { AdvanceForm } from "@/components/forms/AdvanceForm";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { requireStudent } from "@/lib/server/me";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function NewAdvancePage() {
  const { student } = await requireStudent();
  return (
    <>
      <Topbar
        title="Aanvraag voorschot studietoelage"
        showBack
        backHref={routes.newRequest}
        rightSlot={<SignOutForm />}
      />
      <PageShell aside={<ProgressTimeline steps={wizardSteps} activeStepId="formulier" />}>
        <Stack gap="lg">
          <PageHeader
            eyebrow="Stap 2 van 4 · Formulier"
            title="Voorschot studietoelage"
            description="Vraag een voorschot aan in afwachting van je goedgekeurde studietoelage."
          />
          <Card>
            <CardContent className="p-6">
              <Stack gap="lg">
                <StudentDetails student={student} />
                <AdvanceForm />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </PageShell>
    </>
  );
}
