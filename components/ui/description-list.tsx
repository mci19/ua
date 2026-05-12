import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils/cn";

export interface DescriptionItem {
  term: string;
  description?: React.ReactNode;
  fullWidth?: boolean;
}

interface DescriptionListProps {
  items: DescriptionItem[];
  className?: string;
  columns?: 1 | 2;
}

export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl
      className={cn(
        "grid gap-3",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className={item.fullWidth ? "sm:col-span-2" : undefined}>
          <Text as="span" size="small" tone="muted" className="block">
            {item.term}
          </Text>
          <Text as="span" size="label" weight="medium" className="block">
            {item.description ? item.description : "—"}
          </Text>
        </div>
      ))}
    </dl>
  );
}
