import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

// Eyebrow + title + optional description + optional action slot. Used at
// the top of nearly every screen.
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <Stack gap="xs">
        {eyebrow ? (
          <Text size="small" tone="muted" className="uppercase tracking-wide">
            {eyebrow}
          </Text>
        ) : null}
        <Heading level="title" as="h1">
          {title}
        </Heading>
        {description ? (
          <Text tone="muted" className="max-w-prose">
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
