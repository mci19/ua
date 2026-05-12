import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { EditRequestForm } from "@/components/forms/EditRequestForm";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { WizardActions } from "@/components/ui/wizard-actions";
import { requireStudent } from "@/lib/server/me";
import { getRequest } from "@/lib/dataverse/queries";
import { isEditable } from "@/lib/constants/statuses";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function RequestFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { auth, student } = await requireStudent();
  const request = await getRequest(auth, id);
  const editable = isEditable(request.statuscode);
  return (
    <Stack gap="lg">
      <PageHeader
        eyebrow="Stap 2 van 4 · Formulier"
        title={request.ua_filetypeid?.ua_name ?? "Aanvraag"}
      />
      <Card>
        <CardContent className="p-6">
          <Stack gap="lg">
            <StudentDetails student={student} />
            <EditRequestForm request={request} readOnly={!editable} />
          </Stack>
        </CardContent>
      </Card>
      <WizardActions>
        <Button asChild intent="primary">
          <Link href={routes.requestDocuments(id)}>Volgende stap</Link>
        </Button>
      </WizardActions>
    </Stack>
  );
}
