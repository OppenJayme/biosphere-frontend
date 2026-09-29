"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Inquiry } from "@/features/inquiries/types";
import { inquiryTypeLabel } from "@/features/inquiries/workflow";
import { timestampParts } from "@/features/public-submissions/format";
import { formatScheduleDate, formatScheduleTime } from "@/features/public-submissions/schedule";
import type { VisitRequest } from "@/features/visit-requests/types";
import { InquiryStatusBadge, VisitStatusBadge } from "./StatusBadge";

export type SubmissionRows = { kind: "inquiry"; items: Inquiry[] } | { kind: "visit"; items: VisitRequest[] };

const headerClasses = "py-2 pr-3 font-medium";

function Received({ iso }: { iso: string }) {
  const { date, time } = timestampParts(iso);
  return (
    <td className="whitespace-nowrap py-3 pr-3 pl-2 text-xs text-zinc-600">
      <time dateTime={iso}>
        <span className="block">{date}</span>
        <span className="block text-zinc-400">{time}</span>
      </time>
    </td>
  );
}

function scheduleSummary(request: VisitRequest) {
  const schedule = request.approvedSchedule ?? request.preferredSchedules[0];
  if (!schedule) return null;
  return {
    approved: request.approvedSchedule !== null,
    date: formatScheduleDate(schedule.date),
    time: `${formatScheduleTime(schedule.startTime)} – ${formatScheduleTime(schedule.endTime)}`,
    more: request.approvedSchedule ? 0 : request.preferredSchedules.length - 1,
  };
}

export function SubmissionTable({
  rows,
  selectedId,
  hrefFor,
}: {
  rows: SubmissionRows;
  selectedId: string | null;
  hrefFor: (id: string) => string;
}) {
  const router = useRouter();

  function rowProps(id: string) {
    const selected = id === selectedId;
    return {
      // The name cell holds the keyboard-focusable link; the whole row is a larger mouse target.
      onClick: () => router.push(hrefFor(id), { scroll: false }),
      className: `cursor-pointer border-l-4 align-top transition-colors ${
        selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
      }`,
    };
  }

  function nameLink(id: string, name: string) {
    return (
      <Link
        href={hrefFor(id)}
        aria-current={id === selectedId ? "true" : undefined}
        scroll={false}
        onClick={(event) => event.stopPropagation()}
        className="font-medium text-zinc-900 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
      >
        {name}
      </Link>
    );
  }

  if (rows.kind === "inquiry") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs text-zinc-500">
              <th className={headerClasses}>Received</th>
              <th className={headerClasses}>From</th>
              <th className={headerClasses}>Topic</th>
              <th className={headerClasses}>Message</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.items.map((inquiry) => (
              <tr key={inquiry.id} {...rowProps(inquiry.id)}>
                <Received iso={inquiry.createdAt} />
                <td className="py-3 pr-3">
                  <div className="min-w-0">
                      {nameLink(inquiry.id, inquiry.name)}
                      <p className="truncate text-xs text-zinc-500">
                      <span className="font-mono">{inquiry.referenceCode}</span> · {inquiry.organization ?? inquiry.email}
                    </p>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-zinc-700">{inquiryTypeLabel(inquiry.inquiryType)}</td>
                <td className="py-3 pr-3 text-zinc-600">
                  <p className="line-clamp-2 max-w-[22rem] break-words">{inquiry.message}</p>
                </td>
                <td className="py-3">
                  <InquiryStatusBadge status={inquiry.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className={headerClasses}>Received</th>
            <th className={headerClasses}>Contact</th>
            <th className={headerClasses}>Schedule</th>
            <th className={`${headerClasses} text-right`}>Visitors</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {rows.items.map((request) => {
            const schedule = scheduleSummary(request);
            return (
              <tr key={request.id} {...rowProps(request.id)}>
                <Received iso={request.createdAt} />
                <td className="py-3 pr-3">
                  <div className="min-w-0">
                      {nameLink(request.id, request.name)}
                      <p className="truncate text-xs text-zinc-500">
                      <span className="font-mono">{request.referenceCode}</span> · {request.organization}
                    </p>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-xs text-zinc-700">
                  {schedule ? (
                    <>
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                        {schedule.approved ? "Approved" : "Preferred"}
                        {schedule.more > 0 && ` · +${schedule.more} more`}
                      </span>
                      <span className="block">{schedule.date}</span>
                      <span className="block text-zinc-500">{schedule.time}</span>
                    </>
                  ) : (
                    <span className="text-zinc-400">No schedule given</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums text-zinc-700">{request.visitorCount}</td>
                <td className="py-3">
                  <VisitStatusBadge status={request.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
