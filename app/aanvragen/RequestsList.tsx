"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils/date";
import { routes } from "@/lib/constants/routes";
import { REQUEST_STATUS, REQUEST_SUBSTATUS } from "@/lib/constants/statuses";
import type { RequestRow } from "@/lib/dataverse/types";
import { cn } from "@/lib/utils/cn";

function targetHref(row: RequestRow): string {
  return row.ua_satusreason === REQUEST_STATUS.IN_AANMAAK
    ? routes.requestForm(row.ua_requestid)
    : routes.requestMessages(row.ua_requestid);
}

export function RequestsList({ rows }: { rows: RequestRow[] }) {
  return (
    <div>
      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.ua_requestid}>
            <Link
              href={targetHref(row)}
              className="block rounded-lg border border-ua-gray-light/70 bg-white p-4 shadow-sm transition hover:border-ua-navy"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-label font-semibold text-ua-navy">
                    {row.ua_filenumber ?? row.ua_name ?? row.ua_requestid.slice(0, 8)}
                  </p>
                  <p className="truncate text-small text-muted-foreground">
                    {row.ua_filetypeid?.ua_name ?? "—"}
                  </p>
                  <p className="mt-2 text-small text-muted-foreground">
                    Aangemaakt {formatDate(row.createdon)}
                  </p>
                </div>
                <StatusBadge status={row.ua_satusreason} />
              </div>
              {row.ua_substatuscode === REQUEST_SUBSTATUS.ACTIE_VEREIST ? (
                <p className="mt-3 inline-flex items-center gap-2 text-small text-ua-red">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Actie vereist
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
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
              <tr key={row.ua_requestid} className="border-t border-ua-gray-light/70">
                <Td className="font-semibold text-ua-navy">
                  {row.ua_filenumber ?? row.ua_requestid.slice(0, 8)}
                </Td>
                <Td>{row.ua_filetypeid?.ua_name ?? "—"}</Td>
                <Td>{formatDate(row.createdon)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row.ua_satusreason} />
                    {row.ua_substatuscode === REQUEST_SUBSTATUS.ACTIE_VEREIST ? (
                      <span
                        className="inline-flex items-center gap-1 text-small text-ua-red"
                        title="Actie vereist"
                      >
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        Actie vereist
                      </span>
                    ) : null}
                  </div>
                </Td>
                <Td className="text-right">
                  <Link
                    href={targetHref(row)}
                    className="inline-flex items-center gap-1 text-ua-navy hover:underline"
                  >
                    Bekijken <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
