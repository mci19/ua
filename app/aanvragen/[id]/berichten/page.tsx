import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageThread } from "@/components/messages/MessageThread";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { WizardActions } from "@/components/ui/wizard-actions";
import { requireAuthContext } from "@/lib/auth/session";
import { getRequest, listComments } from "@/lib/dataverse/queries";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const [request, comments] = await Promise.all([
    getRequest(auth, id),
    listComments(auth, id, auth.email),
  ]);
  return (
    <Stack gap="lg">
      <PageHeader
        eyebrow="Stap 4 van 4 · Berichten"
        title={request.ua_filetypeid?.ua_name ?? "Berichten"}
        description="Bekijk hier de berichten van je dossierbehandelaar. Heb je vragen of opmerkingen? Typ ze hieronder."
      />
      <Card>
        <CardContent className="p-0">
          <MessageThread requestId={id} initialComments={comments} />
        </CardContent>
      </Card>
      <WizardActions>
        <Button asChild intent="subtle">
          <Link href={routes.requestDocuments(id)}>
            Naar documenten
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </WizardActions>
    </Stack>
  );
}
