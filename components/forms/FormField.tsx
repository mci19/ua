"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Stack } from "@/components/ui/stack";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const descId = hint ? `${htmlFor}-hint` : undefined;
  const errId = error ? `${htmlFor}-error` : undefined;
  return (
    <Stack gap="xs" className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      <div aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}>
        {children}
      </div>
      {hint ? (
        <Text id={descId} as="span" size="small" tone="muted">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text id={errId} as="span" size="small" tone="red" role="alert">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}

export function FormGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["grid gap-4 sm:grid-cols-[2fr_1fr]", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
