import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentDetails } from "@/components/forms/StudentDetails";
import { EditRequestForm } from "@/components/forms/EditRequestForm";
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
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-small uppercase tracking-wide text-muted-foreground">
          Stap 2 van 4 · Formulier
        </p>
        <h2 className="text-title text-ua-navy">{request.ua_filetypeid?.ua_name ?? "Aanvraag"}</h2>
      </div>
      <Card>
        <CardContent className="space-y-6 p-6">
          <StudentDetails student={student} />
          <EditRequestForm request={request} readOnly={!editable} />
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button asChild variant="secondary">
          <Link href={routes.requestDocuments(id)}>Volgende stap</Link>
        </Button>
      </div>
    </div>
  );
}
