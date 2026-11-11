/**
 * Dashboard "Upcoming visits" list (backend spec 0001 AC-9): approved visits from today through the
 * next 13 days. It shows only the date, time, organization, and group size; the contact person and
 * other visitor details stay in Visit Requests.
 */

import Link from "next/link";
import { VISIT_STYLES } from "@/components/public-website/StatusBadge";
import { publicWebsiteHref } from "@/features/public-submissions/query";
import { formatTimeRange } from "@/features/public-submissions/schedule";
import {
  CALENDAR_STATUS_SHORT_LABELS,
  monthOf,
  type VisitCalendarEvent,
} from "@/features/visit-requests/calendar";
import { VISIT_REQUEST_STATUS_LABELS } from "@/features/visit-requests/workflow";

/** Enough to fill the card beside Quick actions; the calendar has the rest. */
const MAX_SHOWN = 6;

const weekdayFormatter = new Intl.DateTimeFormat("en-PH", { weekday: "short", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "UTC" });

function dateParts(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  return { weekday: weekdayFormatter.format(value), day: Number(date.slice(8)), month: monthFormatter.format(value) };
}

/** Link straight to the visit in the calendar month it falls in, with its details open. */
export function visitCalendarHref(event: Pick<VisitCalendarEvent, "id" | "date">, today: string) {
  const month = monthOf(event.date);
  return publicWebsiteHref(
    { tab: "visits", view: "calendar", month: month === monthOf(today) ? "" : month },
    { selected: event.id },
  );
}

export function UpcomingVisits({ events, today }: { events: VisitCalendarEvent[]; today: string }) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">
        No approved visits in the next two weeks. Approved visits appear here and on the calendar.
      </p>
    );
  }

  const shown = events.slice(0, MAX_SHOWN);
  const hidden = events.length - shown.length;

  return (
    <div className="space-y-3">
      <ol className="divide-y divide-black/5">
        {shown.map((event) => {
          const { weekday, day, month } = dateParts(event.date);
          const isToday = event.date === today;
          const statusLabel =
            CALENDAR_STATUS_SHORT_LABELS[event.status as keyof typeof CALENDAR_STATUS_SHORT_LABELS] ??
            VISIT_REQUEST_STATUS_LABELS[event.status];
          return (
            <li key={event.id}>
              <Link
                href={visitCalendarHref(event, today)}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-forest-700"
              >
                <time
                  dateTime={event.date}
                  className={`flex w-11 shrink-0 flex-col items-center rounded-lg py-1 leading-none ${
                    isToday ? "bg-forest-700 text-white" : "bg-forest-50 text-forest-800"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase">{isToday ? "Today" : weekday}</span>
                  <span className="mt-0.5 text-base font-semibold tabular-nums">{day}</span>
                  <span className="sr-only"> {month}</span>
                </time>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900">{event.organization}</span>
                  <span className="block text-xs tabular-nums text-zinc-500">
                    {formatTimeRange(event.startTime, event.endTime)} ·{" "}
                    {event.visitorCount.toLocaleString()} {event.visitorCount === 1 ? "visitor" : "visitors"}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${VISIT_STYLES[event.status]}`}
                >
                  {statusLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {hidden > 0 && (
        <p className="text-xs text-zinc-500">
          {hidden === 1 ? "1 more visit" : `${hidden} more visits`} in the next two weeks are on the calendar.
        </p>
      )}
    </div>
  );
}
