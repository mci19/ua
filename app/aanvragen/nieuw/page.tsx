import Link from "next/link";
import { FileText, Banknote, FileSignature } from "lucide-react";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { routes } from "@/lib/constants/routes";
import { requireStudent } from "@/lib/server/me";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const choices = [
  {
    href: routes.newSocialAllowance,
    icon: Banknote,
    title: "Aanvraag sociale toelage",
    description:
      "Een financiële tegemoetkoming als je tijdelijk moeilijk rondkomt en geen of een onvoldoende studietoelage ontvangt.",
  },
  {
    href: "/aanvragen/nieuw/voorschot",
    icon: FileText,
    title: "Aanvraag voorschot studietoelage",
    description:
      "Vraag een voorschot aan in afwachting van je goedgekeurde studietoelage van de Vlaamse overheid.",
  },
  {
    href: "/aanvragen/nieuw/volmacht",
    icon: FileSignature,
    title: "Verlenen van volmacht",
    description:
      "Geef iemand toestemming om je studentenadministratie in jouw plaats op te volgen.",
  },
];

export default async function NewRequestTypePage() {
  const { student } = await requireStudent();
  if (!student.ua_sisarequestgranted) {
    redirect(`${routes.sisaGrant}?returnTo=${encodeURIComponent(routes.newRequest)}`);
  }
  return (
    <>
      <Topbar title="Aanvraag types" showBack backHref={routes.overview} rightSlot={<SignOutButton />} />
      <PageShell>
        <p className="mb-6 max-w-prose text-body text-muted-foreground">
          Maak een keuze uit de beschikbare opties om je aanvraagproces te starten of
          je volmacht te beheren. Kies de aanvraag die het beste aansluit bij je
          situatie.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {choices.map(({ href, icon: Icon, title, description }) => (
            <Card
              key={href}
              className="group cursor-pointer transition hover:border-ua-navy hover:shadow-md"
            >
              <Link href={href} className="block h-full focus:outline-none">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ua-navy/10 text-ua-navy">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="flex-1 space-y-2">
                    <CardTitle className="group-hover:text-ua-red">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </PageShell>
    </>
  );
}
