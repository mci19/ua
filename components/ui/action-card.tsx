import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils/cn";

interface ActionCardProps {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  iconTone?: "navy" | "red";
  footer?: React.ReactNode;
  className?: string;
}

// Big tappable card used on overview + request-type pickers. Renders the
// whole card as the click target so the entire surface is interactive.
export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  iconTone = "navy",
  footer,
  className,
}: ActionCardProps) {
  return (
    <Card
      className={cn(
        "h-full transition hover:border-ua-navy hover:shadow-md focus-within:border-ua-navy",
        className,
      )}
    >
      <Link
        href={href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ua-navy focus-visible:ring-offset-2 rounded-lg"
      >
        <CardContent className="flex h-full flex-col gap-4 p-6">
          <span
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full text-white",
              iconTone === "navy" ? "bg-ua-navy" : "bg-ua-red",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <Stack gap="xs" className="flex-1">
            <Heading level="header">{title}</Heading>
            {description ? <Text tone="muted">{description}</Text> : null}
          </Stack>
          {footer ? <div className="pt-2">{footer}</div> : null}
        </CardContent>
      </Link>
    </Card>
  );
}
