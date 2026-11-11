/**
 * Public visit availability (backend spec 0001 AC-6, AC-10): museum opening hours plus the date and
 * time ranges approved visits already hold, with no visitor details. The visitor's browser calls
 * the backend directly, like `postPublicSubmission`, so no curator token is ever involved.
 */

import { z } from "zod";
import { env } from "@/lib/env";
import type { BookedRange, OpeningWindow } from "../public-submissions/schedule";
import { addDays } from "./calendar";

const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const visitAvailabilitySchema = z.object({
  openingHours: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), start: timeField, end: timeField })),
  booked: z.array(z.object({ date: dateField, startTime: timeField, endTime: timeField })),
});

/** The backend allows ranges up to 93 days; ask for a little less so a date edge never trips it. */
export const AVAILABILITY_SPAN_DAYS = 90;

export type VisitAvailability = {
  openingHours: OpeningWindow[];
  booked: BookedRange[];
  /** Inclusive date ranges already fetched, so a date outside them can be loaded on demand. */
  covered: { from: string; to: string }[];
};

export function availabilityCovers(availability: VisitAvailability | null, date: string) {
  return Boolean(availability?.covered.some((range) => date >= range.from && date <= range.to));
}

/** Adds a newly fetched range, dropping booked entries that both responses carry. */
export function mergeAvailability(
  current: VisitAvailability | null,
  next: z.infer<typeof visitAvailabilitySchema>,
  range: { from: string; to: string },
): VisitAvailability {
  const seen = new Set<string>();
  const booked = [...(current?.booked ?? []), ...next.booked].filter((entry) => {
    const key = `${entry.date} ${entry.startTime} ${entry.endTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { openingHours: next.openingHours, booked, covered: [...(current?.covered ?? []), range] };
}

/** Booked ranges on one date, earliest first. */
export function bookedOn(availability: VisitAvailability | null, date: string) {
  return (availability?.booked ?? [])
    .filter((entry) => entry.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Fetches `from` plus the next AVAILABILITY_SPAN_DAYS days. Throws when the response is unusable. */
export async function fetchVisitAvailability(from: string, signal?: AbortSignal) {
  const range = { from, to: addDays(from, AVAILABILITY_SPAN_DAYS) };
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/visit-requests/availability?${new URLSearchParams(range)}`,
    { signal, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Availability request failed with status ${response.status}`);
  return { data: visitAvailabilitySchema.parse(await response.json()), range };
}
