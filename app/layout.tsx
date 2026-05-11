import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SkipLink } from "@/components/common/SkipLink";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UA Studentenportaal",
  description: "Vraag een sociale toelage of voorschot aan bij de Universiteit Antwerpen.",
  applicationName: "UA Studentenportaal",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B365F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={openSans.variable}>
      <body className="flex min-h-screen flex-col bg-ua-gray-ultralight font-sans text-foreground">
        <SkipLink />
        <QueryProvider>{children}</QueryProvider>
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
