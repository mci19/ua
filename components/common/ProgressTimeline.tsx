import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Server component on purpose: it receives `steps[].icon` (a Lucide React
// component function) as a prop, and React only allows function props to
// cross the Server-Client boundary via `"use server"`. Since this widget
// has no client-side state (no useState/useEffect/onClick), it's a plain
// Server Component and we render the icons in place.

export interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  activeStepId: string;
  className?: string;
}

export function ProgressTimeline({ steps, activeStepId, className }: ProgressTimelineProps) {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId);
  return (
    <nav aria-label="Stappen" className={cn("w-full", className)}>
      {/* Mobile: horizontal stepper */}
      <ol className="flex w-full items-start justify-between gap-2 lg:hidden">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const status = stateFor(i, activeIndex);
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-1">
              <Marker status={status}>
                {status === "completed" ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden="true" />
                )}
              </Marker>
              <span
                className={cn(
                  "text-center text-small",
                  status === "active" ? "font-semibold text-ua-navy" : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
              {status === "active" && step.subtitle ? (
                <span className="text-center text-small text-muted-foreground">
                  {step.subtitle}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Desktop: vertical timeline */}
      <ol className="hidden lg:block">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const status = stateFor(i, activeIndex);
          const isLast = i === steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-5 top-10 -ml-px h-full w-0.5",
                    status === "completed" ? "bg-success" : "bg-ua-gray-light",
                  )}
                />
              ) : null}
              <Marker status={status}>
                {status === "completed" ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
              </Marker>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-label",
                    status === "active" ? "font-semibold text-ua-navy" : "text-foreground",
                  )}
                >
                  {step.title}
                </span>
                {step.subtitle ? (
                  <span className="text-small text-muted-foreground">{step.subtitle}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type StepState = "completed" | "active" | "future";

function stateFor(i: number, active: number): StepState {
  if (active < 0) return "future";
  if (i < active) return "completed";
  if (i === active) return "active";
  return "future";
}

function Marker({ status, children }: { status: StepState; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2",
        status === "active" && "border-ua-red bg-white text-ua-navy",
        status === "completed" && "border-success bg-success text-white",
        status === "future" && "border-ua-gray-light bg-white text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function withSubtitle(
  steps: TimelineStep[],
  stepId: string,
  subtitle: string | null | undefined,
): TimelineStep[] {
  if (!subtitle) return steps;
  return steps.map((s) => (s.id === stepId ? { ...s, subtitle } : s));
}
