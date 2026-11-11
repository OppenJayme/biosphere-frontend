/**
 * Approved-visit calendar (backend spec 0001, AC-7 to AC-9): event types plus pure month-grid
 * helpers. Dates are museum calendar dates (YYYY-MM-DD), so every computation here works in UTC
 * on those strings and never in the browser's own time zone.
 */

import { z } from "zod";
import { VISIT_REQUEST_STATUSES } from "./types";

// Only visits with a curator-approved schedule reach the calendar (never Pending, Declined, Cancelled).
export const visitCalendarEventSchema = z.object({
  id: z.uuid(),
  referenceCode: z.string().min(1),
  status: z.enum(VISIT_REQUEST_STATUSES),
  organization: z.string(),
  contactPerson: z.string(),
  visitorCount: z.number().int().nonnegative(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export const visitCalendarSchema = z.array(visitCalendarEventSchema);
export type VisitCalendarEvent = z.infer<typeof visitCalendarEventSchema>;

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM" from a URL, or undefined when it is missing or malformed. */
export function parseMonth(value: string | undefined): string | undefined {
  return value && MONTH_PATTERN.test(value) ? value : undefined;
}

export function monthOf(date: string) {
  return date.slice(0, 7);
}

/** The month before (-1) or after (+1) a "YYYY-MM" month. */
export function shiftMonth(month: string, by: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + by, 1));
  return shifted.toISOString().slice(0, 7);
}

function toIsoDate(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  return toIsoDate(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS);
}

/**
 * Whole weeks (Sunday first) covering the month, so the grid never shows a ragged edge.
 * Always 5 or 6 rows of 7 dates.
 */
export function monthGrid(month: string): string[][] {
  const first = `${month}-01`;
  const firstTime = Date.parse(`${first}T00:00:00.000Z`);
  const start = firstTime - new Date(firstTime).getUTCDay() * DAY_MS;
  const nextMonthFirst = Date.parse(`${shiftMonth(month, 1)}-01T00:00:00.000Z`);

  const weeks: string[][] = [];
  for (let weekStart = start; weekStart < nextMonthFirst; weekStart += 7 * DAY_MS) {
    weeks.push(Array.from({ length: 7 }, (_, day) => toIsoDate(weekStart + day * DAY_MS)));
  }
  return weeks;
}

/** First and last date of the grid, which is the range to ask the API for. */
export function monthGridRange(month: string) {
  const weeks = monthGrid(month);
  return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
}

/** Events keyed by date, each day already in start-time order. */
export function eventsByDate(events: VisitCalendarEvent[]) {
  const byDate = new Map<string, VisitCalendarEvent[]>();
  for (const event of events) {
    const day = byDate.get(event.date) ?? [];
    day.push(event);
    byDate.set(event.date, day);
  }
  for (const day of byDate.values()) day.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return byDate;
}

const monthLabelFormatter = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" });



/** "2026-11" -> "November 2026". */
export function formatMonthLabel(month: string) {
  return monthLabelFormatter.format(new Date(`${month}-01T00:00:00.000Z`));
}

/** Days the dashboard "Upcoming visits" card looks ahead, today included (spec 0001 value sourcing). */
export const UPCOMING_VISIT_DAYS = 14;

/** The statuses that hold a time and so appear on the calendar (spec 0001 AC-3, AC-7). */
export const SCHEDULED_VISIT_STATUSES = ["APPROVED_BY_CURATOR", "SUBMITTED_FOR_CAMPUS_ENTRY", "COMPLETED"] as const;

export function isScheduledStatus(status: string) {
  return (SCHEDULED_VISIT_STATUSES as readonly string[]).includes(status);
}

/** Short status words for the small calendar chips; the full label stays in StatusBadge. */
export const CALENDAR_STATUS_SHORT_LABELS: Record<(typeof SCHEDULED_VISIT_STATUSES)[number], string> = {
  APPROVED_BY_CURATOR: "Approved",
  SUBMITTED_FOR_CAMPUS_ENTRY: "Campus entry sent",
  COMPLETED: "Completed",
};

/**
 * Applies the Visit Requests status chip and search box to calendar events. The calendar endpoint
 * has no filters, so search matches what an event carries: organization, contact person, and
 * reference number (the list's search also covers email and purpose).
 */
export function filterCalendarEvents(events: VisitCalendarEvent[], filters: { status: string; search: string }) {
  const needle = filters.search.trim().toLowerCase();
  return events.filter(
    (event) =>
      (!filters.status || event.status === filters.status) &&
      (!needle ||
        [event.organization, event.contactPerson, event.referenceCode].some((value) =>
          value.toLowerCase().includes(needle),
        )),
  );
}
