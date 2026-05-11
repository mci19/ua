import { cn } from "@/lib/utils/cn";

interface PageShellProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

export function PageShell({ children, aside, className }: PageShellProps) {
  return (
    <main
      id="main"
      className={cn(
        "container flex-1 py-6 sm:py-10",
        aside ? "grid gap-8 lg:grid-cols-[1fr_320px]" : "",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {aside ? (
        <aside className="order-first w-full rounded-lg border border-ua-gray-light/70 bg-white p-6 lg:order-last lg:sticky lg:top-24 lg:self-start">
          {aside}
        </aside>
      ) : null}
    </main>
  );
}
