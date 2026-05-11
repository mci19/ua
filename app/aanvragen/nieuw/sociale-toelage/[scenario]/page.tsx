import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { wizardSteps } from "@/components/wizard/steps";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { SocialAllowanceForm } from "@/components/forms/SocialAllowanceForm";
import {
  FILE_TYPE_LABEL_NL,
  SOCIAL_ALLOWANCE_SCENARIOS,
  type FileTypeCode,
} from "@/lib/constants/dossierTypes";
import { requireStudent } from "@/lib/server/me";
import { notFound } from "next/navigation";
import { routes } from "@/lib/constants/routes";

const VALID = new Set<string>(SOCIAL_ALLOWANCE_SCENARIOS);

export const dynamic = "force-dynamic";

export default async function NewSocialAllowanceFormPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario } = await params;
  if (!VALID.has(scenario)) notFound();
  const { student } = await requireStudent();
  const code = scenario as FileTypeCode;
  return (
    <>
      <Topbar
        title="Nieuwe sociale toelage"
        showBack
        backHref={routes.newSocialAllowance}
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
            <h2 className="text-title text-ua-navy">{FILE_TYPE_LABEL_NL[code]}</h2>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <StudentDetails student={student} />
              <SocialAllowanceForm scenarioCode={code} />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
