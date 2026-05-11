"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { DocumentRow, FileDocument } from "@/lib/dataverse/types";

interface ChecklistProps {
  requestId: string;
  requiredDocuments: FileDocument[];
  existing: DocumentRow[];
  readOnly?: boolean;
}

export function DocumentChecklist({
  requestId,
  requiredDocuments,
  existing,
  readOnly,
}: ChecklistProps) {
  const queryClient = useQueryClient();
  const docs = useQuery({
    queryKey: ["documents", requestId],
    initialData: existing,
    queryFn: () => apiFetch<DocumentRow[]>(`/api/requests/${requestId}/documents`),
  });

  if (requiredDocuments.length === 0) {
    return (
      <p className="p-6 text-body text-muted-foreground">
        Voor dit dossiertype zijn geen documenten vereist.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ua-gray-light">
      {requiredDocuments.map((doc) => {
        const match = docs.data?.find((d) => d._ua_filedocumentid_value === doc.ua_filedocumentid);
        return (
          <li key={doc.ua_filedocumentid} className="p-5">
            <DocumentRow
              requestId={requestId}
              fileDocument={doc}
              current={match}
              readOnly={readOnly}
              onChange={() =>
                queryClient.invalidateQueries({ queryKey: ["documents", requestId] })
              }
            />
          </li>
        );
      })}
    </ul>
  );
}

interface RowProps {
  requestId: string;
  fileDocument: FileDocument;
  current?: DocumentRow;
  readOnly?: boolean;
  onChange?: () => void;
}

function DocumentRow({ requestId, fileDocument, current, readOnly, onChange }: RowProps) {
  const [uploading, setUploading] = useState(false);
  const isUploaded = !!current?.ua_isuploaded || !!current?.ua_sharepointurl;
  const isNotApplicable = !!current?.ua_isnotapplicable;
  const required = fileDocument.ua_required;

  const markNotApplicable = useMutation({
    mutationFn: async (notApplicable: boolean) => {
      const fd = new FormData();
      fd.set("notApplicable", String(notApplicable));
      fd.set("fileDocumentId", fileDocument.ua_filedocumentid);
      return apiFetch(`/api/requests/${requestId}/documents`, {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: () => {
      toast.success("Bijgewerkt.");
      onChange?.();
    },
    onError: (err) => toast.error(err.message),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("fileDocumentId", fileDocument.ua_filedocumentid);
      await apiFetch(`/api/requests/${requestId}/documents`, {
        method: "POST",
        body: fd,
      });
      toast.success(`${file.name} opgeladen.`);
      onChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1 space-y-1">
        <p className="text-label font-semibold text-ua-navy">
          {required ? (
            <span className="mr-1 text-ua-red" aria-hidden="true">
              *
            </span>
          ) : null}
          {fileDocument.ua_name}
        </p>
        {fileDocument.ua_info ? (
          <p className="text-small text-muted-foreground">{fileDocument.ua_info}</p>
        ) : null}
        {current?.ua_filename ? (
          <p className="inline-flex items-center gap-2 text-small text-success">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {current.ua_filename}
            {current.ua_lastuploadon ? (
              <span className="text-muted-foreground">
                · {formatDate(current.ua_lastuploadon)}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusPill uploaded={isUploaded} notApplicable={isNotApplicable} required={!!required} />
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-small">
              <Checkbox
                checked={isNotApplicable}
                disabled={markNotApplicable.isPending || uploading}
                onCheckedChange={(v) => markNotApplicable.mutate(v === true)}
              />
              Niet van toepassing
            </label>
            <FileButton
              disabled={isNotApplicable || uploading}
              onPick={handleUpload}
              uploading={uploading}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({
  uploaded,
  notApplicable,
  required,
}: {
  uploaded: boolean;
  notApplicable: boolean;
  required: boolean;
}) {
  if (uploaded || notApplicable) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-small text-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {notApplicable ? "N.v.t." : "Opgeladen"}
      </span>
    );
  }
  if (required) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ua-red/10 px-2.5 py-0.5 text-small text-ua-red">
        <X className="h-4 w-4" aria-hidden="true" />
        Vereist
      </span>
    );
  }
  return <span className="text-small text-muted-foreground">Optioneel</span>;
}

function FileButton({
  onPick,
  disabled,
  uploading,
}: {
  onPick: (file: File) => void;
  disabled?: boolean;
  uploading: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded border border-ua-navy bg-white px-3 text-small text-ua-navy hover:bg-ua-navy/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Upload className="h-4 w-4" aria-hidden="true" />
      {uploading ? "Bezig…" : "Bestand opladen"}
      <Separator orientation="vertical" className="hidden h-4 sm:block" />
      <input
        type="file"
        className="sr-only"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.doc,.xls"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <Button asChild type="button" variant="link" className="sr-only">
        <span>Upload</span>
      </Button>
    </label>
  );
}
