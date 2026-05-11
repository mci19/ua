"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UALogo } from "@/components/common/UALogo";
import { cn } from "@/lib/utils/cn";

interface TopbarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, showBack, backHref, rightSlot, className }: TopbarProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full bg-ua-navy text-white shadow",
        className,
      )}
    >
      <div className="container flex h-16 items-center gap-4 sm:h-20">
        <Link href="/" className="flex items-center" aria-label="Naar de startpagina">
          <UALogo />
        </Link>
        {title ? (
          <h1 className="hidden flex-1 text-header sm:block">{title}</h1>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              aria-label="Terug"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : null}
          {rightSlot}
        </div>
      </div>
      {title ? (
        <div className="container -mt-2 pb-3 sm:hidden">
          <h1 className="text-header">{title}</h1>
        </div>
      ) : null}
    </header>
  );
}

export function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Afmelden</span>
      </Button>
    </form>
  );
}
