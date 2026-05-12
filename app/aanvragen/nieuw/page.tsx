import { redirect } from "next/navigation";
import { FileText, Banknote, FileSignature } from "lucide-react";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { ActionCard } from "@/components/ui/action-card";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { routes } from "@/lib/constants/routes";
import { requireStudent } from "@/lib/server/me";

export const dynamic = "force-dynamic";

const choices = [
  {
    href: routes.newSocialAllowance,
    icon: Banknote,
    title: "Aanvraag sociale toelage",
    description:
      "Een financiële tegemoetkoming als je tijdelijk moeilijk rondkomt en geen of een onvoldoende studietoelage ontvangt.",
    intent: "primary" as const,
  },
  {
    href: "/aanvragen/nieuw/voorschot",
    icon: FileText,
    title: "Aanvraag voorschot studietoelage",
    description:
      "Vraag een voorschot aan in afwachting van je goedgekeurde studietoelage van de Vlaamse overheid.",
    intent: "primary" as const,
  },
  {
    href: "/aanvragen/nieuw/volmacht",
    icon: FileSignature,
    title: "Verlenen van volmacht",
    description:
      "Geef iemand toestemming om je studentenadministratie in jouw plaats op te volgen.",
    intent: "secondary" as const,
  },
];

export default async function NewRequestTypePage() {
  const { student } = await requireStudent();
  if (!student.ua_sisarequestgranted) {
    redirect(`${routes.sisaGrant}?returnTo=${encodeURIComponent(routes.newRequest)}`);
  }
  return (
    <>
      <Topbar
        title="Aanvraag types"
        showBack
        backHref={routes.overview}
        rightSlot={<SignOutButton />}
      />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow="Stap 1 van 4"
            title="Maak een keuze"
            description="Kies de aanvraag die het beste aansluit bij jouw situatie."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {choices.map(({ href, icon, title, description, intent }) => (
              <ActionCard
                key={href}
                href={href}
                icon={icon}
                intent={intent}
                title={title}
                description={description}
              />
            ))}
          </div>
        </Stack>
      </PageShell>
    </>
  );
}
