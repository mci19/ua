import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils/cn";

// A big tappable tile. The whole surface is the click target, so it's
// treated visually like a button: filled brand colour with white text.
const tileVariants = cva(
  [
    "block h-full rounded-lg text-white transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      intent: {
        primary:
          "bg-ua-navy hover:bg-ua-navy-600 active:bg-ua-navy-700 focus-visible:ring-ua-navy",
        secondary:
          "bg-ua-red hover:bg-ua-red-600 active:bg-ua-red-700 focus-visible:ring-ua-red",
      },
    },
    defaultVariants: { intent: "primary" },
  },
);

interface ActionCardProps extends VariantProps<typeof tileVariants> {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  intent,
  className,
}: ActionCardProps) {
  return (
    <Link href={href} className={cn(tileVariants({ intent }), className)}>
      <Stack gap="md" className="h-full p-6">
        <span
          aria-hidden="true"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
        >
          <Icon className="h-6 w-6" />
        </span>
        <Stack gap="xs" className="flex-1">
          <Heading level="header" tone="white">
            {title}
          </Heading>
          {description ? (
            <Text tone="white" className="opacity-90">
              {description}
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </Link>
  );
}
