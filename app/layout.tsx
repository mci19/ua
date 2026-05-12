import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SkipLink } from "@/components/common/SkipLink";
import { DemoBanner } from "@/components/common/DemoBanner";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UA Aanvraag toelagen",
  description: "Vraag een sociale toelage of voorschot aan bij de Universiteit Antwerpen.",
  applicationName: "UA Aanvraag toelagen",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B365F",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={openSans.variable}>
      <body className="flex min-h-screen flex-col bg-ua-gray-ultralight font-sans text-foreground">
        <SkipLink />
        <DemoBanner />
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Brussels">
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 6000 }}
        />
      </body>
    </html>
  );
}
