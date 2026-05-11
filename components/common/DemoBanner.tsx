import { DEMO_BANNER_TEXT, isDemoMode } from "@/lib/demo/flag";

export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div
      role="note"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-center text-small text-warning"
    >
      <span aria-hidden="true">⚠</span>
      <span className="font-medium">{DEMO_BANNER_TEXT}</span>
    </div>
  );
}
