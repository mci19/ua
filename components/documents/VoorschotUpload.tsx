"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
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
    <Stack gap="sm">
      {latest ? (
        <Text
          as="span"
          size="label"
          tone="success"
          className="inline-flex items-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {latest.ua_filename}
          {latest.ua_lastuploadon ? (
            <Text as="span" size="small" tone="muted">
              · {formatDate(latest.ua_lastuploadon)}
            </Text>
          ) : null}
        </Text>
      ) : null}
      {!readOnly ? (
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded bg-ua-navy p-4 text-white hover:bg-ua-navy-600",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          <Text size="label" tone="white">
            {uploading ? "Bezig met opladen…" : "Klik om een PDF op te laden"}
          </Text>
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
        <Text size="small" tone="muted" className="inline-flex items-center gap-2">
          <FileText className="h-4 w-4" aria-hidden="true" /> Aanvraag al ingediend; je
          kan geen nieuwe versie meer opladen.
        </Text>
      )}
    </Stack>
  );
}
