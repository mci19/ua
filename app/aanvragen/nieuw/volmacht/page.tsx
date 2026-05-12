import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { wizardSteps } from "@/components/wizard/steps";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { PowerOfAttorneyForm } from "@/components/forms/PowerOfAttorneyForm";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { requireStudent } from "@/lib/server/me";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function NewPowerOfAttorneyPage() {
  const { student } = await requireStudent();
  return (
    <>
      <Topbar
        title="Verlenen van volmacht"
        showBack
        backHref={routes.newRequest}
        rightSlot={<SignOutButton />}
      />
      <PageShell aside={<ProgressTimeline steps={wizardSteps} activeStepId="formulier" />}>
        <Stack gap="lg">
          <PageHeader
            eyebrow="Stap 2 van 4 · Formulier"
            title="Volmacht verlenen"
            description="Download het volmachtsformulier, laat het ondertekenen en laad de ondertekende versie op."
          />
          <Card>
            <CardContent className="p-6">
              <Stack gap="lg">
                <StudentDetails student={student} />
                <PowerOfAttorneyForm />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </PageShell>
    </>
  );
}
