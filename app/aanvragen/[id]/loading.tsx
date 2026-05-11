import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function Loading() {
  return (
    <div className="container py-10">
      <LoadingSpinner label="Dossier laden…" />
    </div>
  );
}
