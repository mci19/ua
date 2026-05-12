"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      <div className="container flex h-16 items-center gap-3 sm:h-20 sm:gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Naar de startpagina"
        >
          <UALogo
            size="sm"
            badgeClassName="rounded bg-white px-2 py-1 sm:hidden"
            priority
          />
          <UALogo
            size="md"
            badgeClassName="hidden rounded bg-white px-2 py-1.5 sm:inline-flex"
            priority
          />
        </Link>
        {title ? (
          <h1 className="hidden flex-1 truncate text-header sm:block">{title}</h1>
        ) : (
          <div className="flex-1" />
        )}
        {title ? (
          <h1 className="flex-1 truncate text-center text-label sm:hidden">{title}</h1>
        ) : null}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {showBack ? (
            <Button
              intent="onDark"
              size="icon"
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              aria-label="Terug"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : null}
          {rightSlot}
        </div>
      </div>
    </header>
  );
}

// SignOutButton was previously exported here as a client-side <form
// action="/api/auth/signout">. That bypasses NextAuth's CSRF token and
// fails with MissingCSRF in production. Use the server-action
// SignOutForm from "@/components/common/SignOutForm" instead.
