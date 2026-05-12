import type { LucideIcon } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Stack
      align="center"
      gap="sm"
      className={cn(
        "rounded-lg border border-dashed border-ua-gray-light bg-white p-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ua-navy/5 text-ua-navy">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <Heading level="header">{title}</Heading>
      {description ? (
        <Text tone="muted" className="max-w-prose">
          {description}
        </Text>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Stack>
  );
}
