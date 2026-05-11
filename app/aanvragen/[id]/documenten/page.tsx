import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentChecklist } from "@/components/documents/DocumentChecklist";
import { SubmitRequestButton } from "@/components/wizard/SubmitRequestButton";
import { requireAuthContext } from "@/lib/auth/session";
import {
  getRequest,
  listDocumentsForRequest,
  listRequiredDocuments,
} from "@/lib/dataverse/queries";
import { REQUEST_STATUS } from "@/lib/constants/statuses";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const request = await getRequest(auth, id);
  const [required, existing] = await Promise.all([
    request._ua_filetypeid_value
      ? listRequiredDocuments(auth, request._ua_filetypeid_value).catch(() => [])
      : Promise.resolve([]),
    listDocumentsForRequest(auth, id).catch(() => []),
  ]);

  const isEditable = request.ua_satusreason === REQUEST_STATUS.IN_AANMAAK;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-small uppercase tracking-wide text-muted-foreground">
          Stap 3 van 4 · Documenten
        </p>
        <h2 className="text-title text-ua-navy">Laad de nodige documenten op</h2>
        <p className="text-body text-muted-foreground">
          Een rood sterretje geeft een verplicht document aan. Vink &ldquo;Niet van
          toepassing&rdquo; aan als een document niet relevant is voor jouw situatie.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <DocumentChecklist
            requestId={id}
            requiredDocuments={required}
            existing={existing}
            readOnly={!isEditable}
          />
        </CardContent>
      </Card>
      <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
        <Button asChild variant="secondary">
          <Link href={routes.requestForm(id)}>Vorige stap</Link>
        </Button>
        {isEditable ? (
          <SubmitRequestButton requestId={id} />
        ) : (
          <Button asChild>
            <Link href={routes.requestMessages(id)}>Naar berichten</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
