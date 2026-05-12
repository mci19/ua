"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { formatDate } from "@/lib/utils/date";
import { routes } from "@/lib/constants/routes";
import {
  REQUEST_STATUS_CODE,
  isActionRequired,
  isEditable,
} from "@/lib/constants/statuses";
import type { RequestRow } from "@/lib/dataverse/types";
import { cn } from "@/lib/utils/cn";

function targetHref(row: RequestRow): string {
  return isEditable(row.statuscode)
    ? routes.requestForm(row.ua_requestid)
    : routes.requestMessages(row.ua_requestid);
}

function isViewable(row: RequestRow): boolean {
  return row.statuscode !== REQUEST_STATUS_CODE.IN_WACHT;
}

export function RequestsList({ rows }: { rows: RequestRow[] }) {
  return (
    <div>
      <MobileList rows={rows} />
      <DesktopTable rows={rows} />
    </div>
  );
}

function MobileList({ rows }: { rows: RequestRow[] }) {
  return (
    <ul className="space-y-3 md:hidden">
      {rows.map((row) => (
        <li key={row.ua_requestid}>
          <RequestCard row={row} />
        </li>
      ))}
    </ul>
  );
}

function RequestCard({ row }: { row: RequestRow }) {
  const viewable = isViewable(row);
  return (
    <div className="rounded-lg border border-ua-gray-light/70 bg-white p-4 shadow-sm">
      <Stack gap="sm">
        <div className="flex items-start justify-between gap-3">
          <Stack gap="none" className="min-w-0">
            <Heading
              level="subheader"
              as="p"
              className="truncate normal-case tracking-normal"
            >
              {row.ua_filenumber ?? row.ua_name ?? row.ua_requestid.slice(0, 8)}
            </Heading>
            <Text size="small" tone="muted" className="truncate">
              {row.ua_filetypeid?.ua_name ?? "—"}
            </Text>
            <Text size="small" tone="muted" className="mt-2">
              Aangemaakt {formatDate(row.createdon)}
            </Text>
          </Stack>
          <StatusBadge status={row.statuscode} />
        </div>
        {isActionRequired(row.ua_substatuscode) ? (
          <Text size="small" tone="red" className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Actie vereist
          </Text>
        ) : null}
        <div className="flex justify-end pt-1">
          {viewable ? (
            <Button asChild intent="primary" size="sm">
              <Link href={targetHref(row)}>
                Bekijken
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Text as="span" size="small" tone="muted">
              In wachtrij
            </Text>
          )}
        </div>
      </Stack>
    </div>
  );
}

function DesktopTable({ rows }: { rows: RequestRow[] }) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-ua-gray-light/70 bg-white md:block">
      <table className="w-full text-left text-label">
        <thead className="bg-ua-navy text-white">
          <tr>
            <Th>Dossiernummer</Th>
            <Th>Type</Th>
            <Th>Aangemaakt</Th>
            <Th>Status</Th>
            <Th className="text-right">Actie</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RequestRowItem key={row.ua_requestid} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestRowItem({ row }: { row: RequestRow }) {
  return (
    <tr className="border-t border-ua-gray-light/70">
      <Td>
        <Text size="label" tone="navy" weight="semibold">
          {row.ua_filenumber ?? row.ua_requestid.slice(0, 8)}
        </Text>
      </Td>
      <Td>{row.ua_filetypeid?.ua_name ?? "—"}</Td>
      <Td>{formatDate(row.createdon)}</Td>
      <Td>
        <div className="flex items-center gap-2">
          <StatusBadge status={row.statuscode} />
          {isActionRequired(row.ua_substatuscode) ? (
            <Text
              as="span"
              size="small"
              tone="red"
              className="inline-flex items-center gap-1"
              title="Actie vereist"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Actie vereist
            </Text>
          ) : null}
        </div>
      </Td>
      <Td className="text-right">
        {isViewable(row) ? (
          <Button asChild intent="primary" size="sm">
            <Link href={targetHref(row)}>
              Bekijken
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Text as="span" size="small" tone="muted">
            In wachtrij
          </Text>
        )}
      </Td>
    </tr>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-small font-semibold uppercase tracking-wide", className)}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
