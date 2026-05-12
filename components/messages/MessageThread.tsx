"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
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
          <Text tone="muted">Nog geen berichten in dit dossier.</Text>
        ) : (
          <Stack as="ul" gap="md">
            {comments.map((c) => (
              <CommentBubble key={c.id} comment={c} />
            ))}
            <li ref={endRef} aria-hidden="true" />
          </Stack>
        )}
      </div>
      <form
        noValidate
        onSubmit={handleSubmit((v) => send.mutate(v))}
        className="border-t border-ua-gray-light p-5"
      >
        <Stack gap="sm">
          <FormField label="Nieuw bericht" htmlFor="text" error={errors.text?.message}>
            <Textarea id="text" placeholder="Schrijf een bericht…" rows={3} {...register("text")} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" intent="primary" disabled={isSubmitting || send.isPending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {send.isPending ? "Bezig…" : "Bericht verzenden"}
            </Button>
          </div>
        </Stack>
      </form>
    </div>
  );
}

function CommentBubble({ comment }: { comment: Comment }) {
  const isStaff = comment.role === "dossierbeheerder";
  return (
    <li className={cn("flex flex-col", isStaff ? "items-start" : "items-end")}>
      <span
        className={cn(
          "mb-1 inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-small font-medium",
          isStaff ? "bg-ua-red/10 text-ua-red" : "bg-ua-navy/10 text-ua-navy",
        )}
      >
        {isStaff ? "Dossierbeheerder" : "Student"}
        {comment.authorName ? (
          <span className="text-muted-foreground">· {comment.authorName}</span>
        ) : null}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
          isStaff
            ? "rounded-tl-none bg-ua-gray-light/60 text-foreground"
            : "rounded-tr-none bg-ua-navy text-white",
        )}
      >
        <p className="whitespace-pre-wrap text-label">{comment.text}</p>
        <p
          className={cn(
            "mt-1 text-small",
            isStaff ? "text-muted-foreground" : "text-white/70",
          )}
        >
          {formatDateTime(comment.createdOn)}
        </p>
      </div>
    </li>
  );
}
