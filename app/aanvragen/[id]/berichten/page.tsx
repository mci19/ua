import { MessageThread } from "@/components/messages/MessageThread";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuthContext } from "@/lib/auth/session";
import { getRequest, listComments } from "@/lib/dataverse/queries";

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
    listComments(auth, id).catch(() => []),
  ]);
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-small uppercase tracking-wide text-muted-foreground">
          Stap 4 van 4 · Berichten
        </p>
        <h2 className="text-title text-ua-navy">{request.ua_filetypeid?.ua_name ?? "Berichten"}</h2>
        <p className="text-body text-muted-foreground">
          Bekijk hier de berichten van je dossierbehandelaar. Heb je vragen of
          opmerkingen? Typ ze hieronder.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <MessageThread requestId={id} initialComments={comments} />
        </CardContent>
      </Card>
    </div>
  );
}
