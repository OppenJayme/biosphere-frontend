"use client";

/**
 * Month calendar of approved visits inside Visit Requests (backend spec 0001 AC-8). It is a second
 * view of the same records: each visit links to the same `selected` URL the list uses, so the
 * existing Visit Request Management panel opens below. Dates are museum calendar dates, never
 * shifted into the browser's own time zone.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent } from "react";
import { AlertTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { publicWebsiteHref, type PublicWebsiteQuery } from "@/features/public-submissions/query";
import { dayOfWeek, formatTimeRange, openingWindowsFor } from "@/features/public-submissions/schedule";
import {
  CALENDAR_STATUS_SHORT_LABELS,
  SCHEDULED_VISIT_STATUSES,
  eventsByDate,
  formatMonthLabel,
  isScheduledStatus,
  monthGrid,
  monthOf,
  shiftMonth,
  type VisitCalendarEvent,
} from "@/features/visit-requests/calendar";
import { VISIT_REQUEST_STATUS_LABELS } from "@/features/visit-requests/workflow";
import { VISIT_STYLES } from "./StatusBadge";

export type VisitCalendarData = {
  /** "YYYY-MM" being shown. */
  month: string;
  /** The museum's today (YYYY-MM-DD), from the server so the highlight never disagrees with it. */
  today: string;
  /** Events after the status and search filters; null when the calendar failed to load. */
  events: VisitCalendarEvent[] | null;
  error?: string;
};

type VisitsQuery = Extract<PublicWebsiteQuery, { tab: "visits" }>;

const WEEKDAYS = [
  { short: "Sun", long: "Sunday" },
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
];

const navButtonClasses =
  "inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-black/10 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700";

/** Ordinary clicks stay in the page so the grid can show it is loading; modified clicks open a tab. */
function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function emptyMessage(query: VisitsQuery, monthLabel: string) {
  if (query.status && !isScheduledStatus(query.status)) {
    return `${VISIT_REQUEST_STATUS_LABELS[query.status]} requests are not on the calendar because they do not hold a time. Switch to the list to see them.`;
  }
  if (query.status || query.search) return `No approved visits in ${monthLabel} match these filters.`;
  return `No approved visits in ${monthLabel} yet. A visit appears here once a curator approves one of its preferred schedules.`;
}

export function VisitCalendar({
  data,
  query,
  selectedId,
  onSelectedEventActivate,
}: {
  data: VisitCalendarData;
  query: VisitsQuery;
  selectedId: string | null;
  /** Picking the visit that is already open only scrolls back to its details. */
  onSelectedEventActivate: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { month, today, events } = data;
  const monthLabel = formatMonthLabel(month);
  const weeks = monthGrid(month);
  const byDate = eventsByDate(events ?? []);
  const count = events?.filter((event) => monthOf(event.date) === month).length ?? 0;

  const monthHref = (target: string) =>
    publicWebsiteHref({ ...query, view: "calendar", month: target === monthOf(today) ? "" : target });

  function goToMonth(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    startTransition(() => router.push(href, { scroll: false }));
  }

  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="visit-calendar-heading" className="font-serif text-xl font-semibold text-forest-800">
            {monthLabel}
          </h2>
          <p aria-live="polite" className="mt-0.5 text-xs text-zinc-500">
            {pending
              ? "Loading the month…"
              : events === null
                ? "Approved visits could not be loaded."
                : `${count === 1 ? "1 approved visit" : `${count.toLocaleString()} approved visits`} this month`}
          </p>
        </div>
        <nav aria-label="Calendar months" className="flex items-center gap-1.5">
          <Link
            href={monthHref(previous)}
            onClick={(event) => goToMonth(event, monthHref(previous))}
            className={navButtonClasses}
            aria-label={`Previous month, ${formatMonthLabel(previous)}`}
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={monthHref(monthOf(today))}
            onClick={(event) => goToMonth(event, monthHref(monthOf(today)))}
            aria-current={month === monthOf(today) ? "date" : undefined}
            className={navButtonClasses}
          >
            This month
          </Link>
          <Link
            href={monthHref(next)}
            onClick={(event) => goToMonth(event, monthHref(next))}
            className={navButtonClasses}
            aria-label={`Next month, ${formatMonthLabel(next)}`}
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>

      <ul aria-label="Calendar legend" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-600">
        {SCHEDULED_VISIT_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${VISIT_STYLES[status]}`} />
            {VISIT_REQUEST_STATUS_LABELS[status]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-black/10 bg-sage-100" />
          Closed (Sundays)
        </li>
      </ul>

      {events === null ? (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangleIcon className="h-4 w-4" />
            Unable to load the calendar
          </p>
          <p className="mt-1">{data.error}</p>
          <Link
            href={publicWebsiteHref(query)}
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
          >
            Retry
          </Link>
        </div>
      ) : (
        count === 0 && (
          <p className="rounded-lg bg-sage-50 px-3 py-2 text-xs text-zinc-600">{emptyMessage(query, monthLabel)}</p>
        )
      )}

      {/* Wide grid scrolls inside the card on narrow screens instead of squeezing the days. */}
      <div
        aria-busy={pending || undefined}
        className={`overflow-x-auto rounded-lg border border-black/10 transition-opacity motion-reduce:transition-none ${
          pending ? "opacity-50" : ""
        }`}
      >
        <table aria-labelledby="visit-calendar-heading" className="w-full min-w-[720px] table-fixed border-collapse">
          <caption className="sr-only">
            Approved visits in {monthLabel}, one week per row. Choose a visit to open its details below the calendar.
          </caption>
          <thead>
            <tr className="bg-sage-50">
              {WEEKDAYS.map((day) => (
                <th
                  key={day.short}
                  scope="col"
                  className="border-b border-black/10 px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500"
                >
                  <abbr title={day.long} className="no-underline">
                    {day.short}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((date) => {
                  const inMonth = monthOf(date) === month;
                  const isToday = date === today;
                  const closed = openingWindowsFor(date).length === 0;
                  const dayEvents = byDate.get(date) ?? [];
                  return (
                    <td
                      key={date}
                      className={`h-28 border border-black/5 p-1.5 align-top ${
                        !inMonth ? "bg-zinc-50" : closed ? "bg-sage-100/60" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <time
                          dateTime={date}
                          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                            isToday
                              ? "bg-forest-700 font-semibold text-white"
                              : inMonth
                                ? "font-medium text-zinc-800"
                                : "text-zinc-400"
                          }`}
                        >
                          {Number(date.slice(8))}
                          {isToday && <span className="sr-only">, today</span>}
                        </time>
                        {closed && inMonth && dayOfWeek(date) === 0 && (
                          <span className="text-[10px] font-medium text-zinc-500">Closed</span>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {dayEvents.map((event) => {
                            const selected = event.id === selectedId;
                            const statusLabel =
                              CALENDAR_STATUS_SHORT_LABELS[event.status as keyof typeof CALENDAR_STATUS_SHORT_LABELS] ??
                              VISIT_REQUEST_STATUS_LABELS[event.status];
                            return (
                              <li key={event.id}>
                                <Link
                                  href={publicWebsiteHref(query, { selected: event.id })}
                                  scroll={false}
                                  onClick={selected ? onSelectedEventActivate : undefined}
                                  aria-current={selected ? "true" : undefined}
                                  title={`${event.organization}, ${VISIT_REQUEST_STATUS_LABELS[event.status]}`}
                                  className={`block rounded-md px-1.5 py-1 text-[11px] leading-snug hover:ring-1 hover:ring-black/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-forest-700 ${
                                    VISIT_STYLES[event.status]
                                  } ${selected ? "ring-2 ring-forest-700" : ""}`}
                                >
                                  <span className="block font-semibold tabular-nums">
                                    {formatTimeRange(event.startTime, event.endTime)}
                                  </span>
                                  <span className="block truncate">{event.organization}</span>
                                  <span className="block truncate">
                                    {statusLabel}, {event.visitorCount.toLocaleString()}{" "}
                                    {event.visitorCount === 1 ? "visitor" : "visitors"}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
