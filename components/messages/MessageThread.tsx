"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { apiFetch } from "@/lib/api/fetcher";
import { commentSchema, type CommentInput } from "@/lib/schemas/request";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Comment } from "@/lib/dataverse/types";

interface MessageThreadProps {
  requestId: string;
  initialComments: Comment[];
}

export function MessageThread({ requestId, initialComments }: MessageThreadProps) {
  const queryClient = useQueryClient();
  const endRef = useRef<HTMLLIElement | null>(null);

  const list = useQuery({
    queryKey: ["comments", requestId],
    initialData: initialComments,
    queryFn: () => apiFetch<Comment[]>(`/api/requests/${requestId}/comments`),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list.data?.length]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  const send = useMutation({
    mutationFn: (values: CommentInput) =>
      apiFetch<Comment>(`/api/requests/${requestId}/comments`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      reset({ text: "" });
      queryClient.invalidateQueries({ queryKey: ["comments", requestId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const comments = list.data ?? [];

  return (
    <div className="flex flex-col">
      <div className="max-h-[50vh] min-h-[280px] overflow-y-auto p-5">
        {comments.length === 0 ? (
          <p className="text-body text-muted-foreground">
            Nog geen berichten in dit dossier.
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c, i) => (
              <li
                key={c.ua_commentid ?? `${i}-${c.createdon}`}
                className={cn(
                  "flex",
                  c.ua_authortype === "dossierbeheerder" ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
                    c.ua_authortype === "dossierbeheerder"
                      ? "bg-ua-gray-light/60 text-foreground"
                      : "bg-ua-navy text-white",
                  )}
                >
                  <p className="whitespace-pre-wrap text-label">{c.ua_comment}</p>
                  <p
                    className={cn(
                      "mt-1 text-small",
                      c.ua_authortype === "dossierbeheerder"
                        ? "text-muted-foreground"
                        : "text-white/70",
                    )}
                  >
                    {formatDateTime(c.createdon)}
                  </p>
                </div>
              </li>
            ))}
            <li ref={endRef} aria-hidden="true" />
          </ul>
        )}
      </div>
      <form
        noValidate
        onSubmit={handleSubmit((v) => send.mutate(v))}
        className="border-t border-ua-gray-light p-5"
      >
        <FormField
          label="Nieuw bericht"
          htmlFor="text"
          error={errors.text?.message}
        >
          <Textarea
            id="text"
            placeholder="Schrijf een bericht…"
            rows={3}
            {...register("text")}
          />
        </FormField>
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={isSubmitting || send.isPending}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {send.isPending ? "Bezig…" : "Bericht verzenden"}
          </Button>
        </div>
      </form>
    </div>
  );
}
