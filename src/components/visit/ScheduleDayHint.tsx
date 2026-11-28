"use client";

/**
 * Under a preferred schedule option on the public form, only what is particular to that row's
 * date: a closed day, or times approved visits already hold that day (backend spec 0001 AC-10).
 * The week's opening hours, and a failed booked-times check, are shown once above the options
 * instead of under every row. It never shows who booked a time; the endpoint does not return that.
 */

import { ClockIcon } from "@/components/icons";
import { availabilityCovers, bookedOn, type VisitAvailability } from "@/features/visit-requests/availability";
import { MUSEUM_OPENING_HOURS, dayName, formatTimeRange, openingWindowsFor } from "@/features/public-submissions/schedule";

/** Whether the row for `date` has a closed day or booked times to point out. */
export function scheduleDayHintShown(date: string, availability: VisitAvailability | null) {
  const closed = openingWindowsFor(date, availability?.openingHours ?? MUSEUM_OPENING_HOURS).length === 0;
  return closed || (availabilityCovers(availability, date) && bookedOn(availability, date).length > 0);
}

export function ScheduleDayHint({
  id,
  date,
  availability,
}: {
  id: string;
  /** A real YYYY-MM-DD date on or after today, for which scheduleDayHintShown is true. */
  date: string;
  availability: VisitAvailability | null;
}) {
  const windows = openingWindowsFor(date, availability?.openingHours ?? MUSEUM_OPENING_HOURS);

  if (windows.length === 0) {
    return (
      <p id={id} aria-live="polite" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        The museum is closed on {dayName(date)}s. Choose another day.
      </p>
    );
  }

  const booked = bookedOn(availability, date);
  return (
    <p id={id} aria-live="polite" className="mt-3 flex items-start gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-sm text-ink">
      <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
      <span>
        <span className="font-medium">Already booked that day:</span>{" "}
        {booked.map((range) => formatTimeRange(range.startTime, range.endTime)).join(", ")}. Choose a time that does not
        overlap.
      </span>
    </p>
  );
}
