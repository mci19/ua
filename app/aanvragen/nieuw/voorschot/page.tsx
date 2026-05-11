import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { wizardSteps } from "@/components/wizard/steps";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { AdvanceForm } from "@/components/forms/AdvanceForm";
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
            <h2 className="text-title text-ua-navy">Voorschot studietoelage</h2>
            <p className="text-body text-muted-foreground">
              Vraag een voorschot aan in afwachting van je goedgekeurde studietoelage.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <StudentDetails student={student} />
              <AdvanceForm />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
