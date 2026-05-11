import Link from "next/link";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { DOSSIER_SUBTYPE_ID, DOSSIER_SUBTYPE_LABEL_NL } from "@/lib/constants/dossierTypes";
import { routes } from "@/lib/constants/routes";

const scenarios: { id: keyof typeof DOSSIER_SUBTYPE_LABEL_NL; href: string }[] = [
  {
    id: DOSSIER_SUBTYPE_ID.STUDIETOELAGE_TOEGEKEND,
    href: `/aanvragen/nieuw/sociale-toelage/${DOSSIER_SUBTYPE_ID.STUDIETOELAGE_TOEGEKEND}`,
  },
  {
    id: DOSSIER_SUBTYPE_ID.LEEFLOON,
    href: `/aanvragen/nieuw/sociale-toelage/${DOSSIER_SUBTYPE_ID.LEEFLOON}`,
  },
  {
    id: DOSSIER_SUBTYPE_ID.VERMOEDE_VAN_TEKORT,
    href: routes.newSocialAllowanceOther,
  },
];

export default function SocialAllowancePickerPage() {
  return (
    <>
      <Topbar
        title="Aanvraag sociale toelage"
        showBack
        backHref={routes.newRequest}
        rightSlot={<SignOutButton />}
      />
      <PageShell>
        <p className="mb-6 max-w-prose text-body text-muted-foreground">
          Welke situatie omschrijft jouw aanvraag het best?
        </p>
        <ul className="space-y-3">
          {scenarios.map(({ id, href }) => (
            <li key={id}>
              <Card className="transition hover:border-ua-navy">
                <Link href={href} className="block focus:outline-none">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <span className="text-label text-foreground">
                      {DOSSIER_SUBTYPE_LABEL_NL[id]}
                    </span>
                    <ChevronRight className="h-5 w-5 text-ua-navy" aria-hidden="true" />
                  </CardContent>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button asChild variant="secondary">
            <Link href={routes.newRequest}>Annuleren</Link>
          </Button>
        </div>
      </PageShell>
    </>
  );
}
