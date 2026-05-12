import { notFound } from "next/navigation";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { wizardSteps } from "@/components/wizard/steps";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { SocialAllowanceForm } from "@/components/forms/SocialAllowanceForm";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import {
  FILE_TYPE_LABEL_NL,
  SOCIAL_ALLOWANCE_SCENARIOS,
  type FileTypeCode,
} from "@/lib/constants/dossierTypes";
import { requireStudent } from "@/lib/server/me";
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
        rightSlot={<SignOutForm />}
      />
      <PageShell aside={<ProgressTimeline steps={wizardSteps} activeStepId="formulier" />}>
        <Stack gap="lg">
          <PageHeader eyebrow="Stap 2 van 4 · Formulier" title={FILE_TYPE_LABEL_NL[code]} />
          <Card>
            <CardContent className="p-6">
              <Stack gap="lg">
                <StudentDetails student={student} />
                <SocialAllowanceForm scenarioCode={code} />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </PageShell>
    </>
  );
}
