"use client";

/**
 * Under each preferred schedule option on the public form: that day's opening hours and the times
 * approved visits already hold (backend spec 0001 AC-10). It never shows who booked a time; the
 * availability endpoint does not return that.
 */

import { ClockIcon } from "@/components/icons";
import { availabilityCovers, bookedOn, type VisitAvailability } from "@/features/visit-requests/availability";
import {
  MUSEUM_OPENING_HOURS,
  dayName,
  describeWindows,
  formatTimeRange,
  openingWindowsFor,
} from "@/features/public-submissions/schedule";
import type { AvailabilityStatus } from "./useVisitAvailability";

export function ScheduleDayHint({
  id,
  date,
  availability,
  status,
}: {
  id: string;
  /** A real YYYY-MM-DD date on or after today; the caller skips empty and past dates. */
  date: string;
  availability: VisitAvailability | null;
  status: AvailabilityStatus;
}) {
  const windows = openingWindowsFor(date, availability?.openingHours ?? MUSEUM_OPENING_HOURS);
  const loaded = availabilityCovers(availability, date);
  const booked = bookedOn(availability, date);

  if (windows.length === 0) {
    return (
      <p id={id} aria-live="polite" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        The museum is closed on {dayName(date)}s. Choose another day.
      </p>
    );
  }

  return (
    <div id={id} aria-live="polite" className="mt-3 space-y-1 rounded-lg bg-brand-soft px-3 py-2 text-sm text-ink">
      <p className="flex items-start gap-1.5">
        <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span>
          <span className="font-medium">Open {dayName(date)},</span> {describeWindows(windows)}.
        </span>
      </p>
      <p className="pl-5.5 text-ink-muted">
        {loaded
          ? booked.length > 0
            ? `Already booked that day: ${booked.map((range) => formatTimeRange(range.startTime, range.endTime)).join(", ")}. Choose a time that does not overlap.`
            : "No visits are booked yet that day."
          : status === "error"
            ? "We could not check booked times right now. You can still send your request; the museum will confirm the time with you."
            : "Checking which times are already booked…"}
      </p>
    </div>
  );
}
