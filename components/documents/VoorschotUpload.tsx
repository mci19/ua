"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/date";
import type { DocumentRow } from "@/lib/dataverse/types";

export function VoorschotUpload({
  requestId,
  existing,
  readOnly,
}: {
  requestId: string;
  existing: DocumentRow[];
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const latest = existing.find((d) => d.ua_isuploaded);

  async function handle(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      // Voorschot/PoA flow: no per-row fileDocumentId; use the request id as
      // the discriminator so the API can find/replace the previous version.
      fd.set("fileDocumentId", requestId);
      await apiFetch(`/api/requests/${requestId}/documents`, {
        method: "POST",
        body: fd,
      });
      toast.success("Document opgeladen.");
      queryClient.invalidateQueries({ queryKey: ["documents", requestId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {latest ? (
        <p className="inline-flex items-center gap-2 text-label text-success">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {latest.ua_filename}
          {latest.ua_lastuploadon ? (
            <span className="text-small text-muted-foreground">
              · {formatDate(latest.ua_lastuploadon)}
            </span>
          ) : null}
        </p>
      ) : null}
      {!readOnly ? (
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded border border-dashed border-ua-navy bg-ua-navy/5 p-4 text-ua-navy hover:bg-ua-navy/10",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          <span className="text-label">
            {uploading ? "Bezig met opladen…" : "Klik of sleep een PDF om op te laden"}
          </span>
          <input
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handle(file);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <p className="inline-flex items-center gap-2 text-small text-muted-foreground">
          <FileText className="h-4 w-4" aria-hidden="true" /> Aanvraag al ingediend; je
          kan geen nieuwe versie meer opladen.
        </p>
      )}
    </div>
  );
}
