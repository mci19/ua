import { cn } from "@/lib/utils/cn";

// Bottom action bar used in wizard screens. Stacks vertically on mobile,
// right-aligned in a row on sm+. Pass back/cancel buttons before primary.
export function WizardActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
