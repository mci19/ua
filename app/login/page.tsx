import Link from "next/link";
import { signIn } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { UALogo } from "@/components/common/UALogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDemoMode } from "@/lib/demo/flag";
import { safeRedirectPath } from "@/lib/utils/safeUrl";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  // Whitelist relative paths only — defeats open-redirect via
  // ?callbackUrl=https://evil.example.org
  const redirectTo = safeRedirectPath(callbackUrl, "/");
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <section className="relative flex items-center justify-center bg-white p-10 lg:border-r-8 lg:border-ua-red">
        <UALogo size="xl" priority />
      </section>
      <section className="flex items-center justify-center bg-ua-gray-ultralight p-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-2">
            <h1 className="text-title text-ua-navy">Welkom bij Aanvraag toelagen</h1>
            <p className="text-body text-muted-foreground">
              {isDemoMode
                ? "Demo modus — log in met een testaccount."
                : "Meld je aan met je UAntwerpen-account om je aanvragen te beheren."}
            </p>
          </header>
          {error ? (
            <p className="rounded border border-ua-red/30 bg-ua-red/5 p-3 text-small text-ua-red">
              Aanmelden mislukt. Probeer het opnieuw.
            </p>
          ) : null}

          {isDemoMode ? (
            <>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("demo", {
                    username: String(formData.get("username") ?? ""),
                    password: String(formData.get("password") ?? ""),
                    redirectTo,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="username" required>Gebruikersnaam</Label>
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="anna / tom / lara"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" required>Wachtwoord</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="demo"
                    defaultValue="demo"
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Aanmelden
                </Button>
              </form>
              <div className="rounded border border-ua-gray-light bg-ua-gray-ultralight p-4 text-small">
                <p className="font-semibold text-ua-navy">Testaccounts</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li><span className="font-mono">anna</span> — SISA toegekend + 2 aanvragen</li>
                  <li><span className="font-mono">tom</span> — SISA nog niet toegekend</li>
                  <li><span className="font-mono">lara</span> — niet gekend → onboarding</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  Wachtwoord voor alle accounts: <span className="font-mono">demo</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <form
                action={async () => {
                  "use server";
                  await signIn("microsoft-entra-id", { redirectTo });
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
