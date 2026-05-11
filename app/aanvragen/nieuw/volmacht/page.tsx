import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { wizardSteps } from "@/components/wizard/steps";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { PowerOfAttorneyForm } from "@/components/forms/PowerOfAttorneyForm";
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
      <PageShell
        aside={<ProgressTimeline steps={wizardSteps} activeStepId="formulier" />}
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-small uppercase tracking-wide text-muted-foreground">
              Stap 2 van 4 · Formulier
            </p>
            <h2 className="text-title text-ua-navy">Volmacht verlenen</h2>
            <p className="text-body text-muted-foreground">
              Download het volmachtsformulier, laat het ondertekenen en laad de
              ondertekende versie op.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <StudentDetails student={student} />
              <PowerOfAttorneyForm />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
