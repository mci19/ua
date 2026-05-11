import Link from "next/link";
import { signIn } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { UALogo } from "@/components/common/UALogo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <section className="flex items-center justify-center bg-ua-navy p-10 text-white">
        <UALogo />
      </section>
      <section className="flex items-center justify-center p-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-2">
            <h1 className="text-title text-ua-navy">Welkom bij het studentenportaal</h1>
            <p className="text-body text-muted-foreground">
              Meld je aan met je UAntwerpen-account om je aanvragen te beheren.
            </p>
          </header>
          {error ? (
            <p className="rounded border border-ua-red/30 bg-ua-red/5 p-3 text-small text-ua-red">
              Aanmelden mislukt. Probeer het opnieuw.
            </p>
          ) : null}
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: callbackUrl ?? "/" });
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              Aanmelden met Microsoft
            </Button>
          </form>
          <p className="text-small text-muted-foreground">
            Heb je hulp nodig?{" "}
            <Link
              href="https://www.uantwerpen.be/nl/studeren/financiele-info/"
              className="ua-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bezoek de financiële infopagina
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
