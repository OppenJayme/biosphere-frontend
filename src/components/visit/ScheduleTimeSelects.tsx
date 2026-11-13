"use client";

/**
 * Start and end time pickers for one preferred schedule option, used by the public visit form and
 * the curator referral dialog. They only offer times inside that day's opening windows (15 minute
 * steps), so a visitor cannot pick 6:00 AM on a Saturday the way a free time input allowed; booked
 * and already-passed times stay listed but disabled. The backend still re-checks every rule.
 */

import {
  endTimeSlots,
  museumClock,
  startTimeSlots,
  type MuseumClock,
  type ScheduleRules,
} from "@/features/public-submissions/schedule";

type InvalidProps = { "aria-invalid"?: true; "aria-describedby"?: string };

export function ScheduleStartSelect({
  id,
  name = "scheduleStart",
  date,
  value,
  onChange,
  rules,
  clock = museumClock(),
  className,
  invalid,
}: {
  id?: string;
  name?: string;
  /** YYYY-MM-DD, or "" before a date is chosen. */
  date: string;
  value: string;
  onChange: (value: string) => void;
  rules: ScheduleRules;
  clock?: MuseumClock;
  className: string;
  invalid?: InvalidProps;
}) {
  const slots = date ? startTimeSlots(date, rules, clock) : [];
  // Short: the three-column row leaves about 7rem per picker. The day hint explains the rest.
  const placeholder = date && slots.length === 0 ? "Closed" : "Select";
  return (
    <select
      id={id}
      name={name}
      required
      value={slots.some((slot) => slot.value === value) ? value : ""}
      // Never `disabled`: a disabled select drops out of FormData and shifts later rows.
      aria-disabled={slots.length === 0 || undefined}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      {...invalid}
    >
      <option value="">{placeholder}</option>
      {slots.map((slot) => (
        <option key={slot.value} value={slot.value} disabled={slot.disabled}>
          {slot.label}
        </option>
      ))}
    </select>
  );
}

export function ScheduleEndSelect({
  id,
  name = "scheduleEnd",
  date,
  startTime,
  value,
  onChange,
  rules,
  className,
  invalid,
}: {
  id?: string;
  name?: string;
  date: string;
  startTime: string;
  value: string;
  onChange: (value: string) => void;
  rules: ScheduleRules;
  className: string;
  invalid?: InvalidProps;
}) {
  const slots = date && startTime ? endTimeSlots(date, startTime, rules) : [];
  return (
    <select
      id={id}
      name={name}
      required
      value={slots.some((slot) => slot.value === value) ? value : ""}
      // Never `disabled`: a disabled select drops out of FormData and shifts later rows.
      aria-disabled={slots.length === 0 || undefined}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      {...invalid}
    >
      <option value="">Select</option>
      {slots.map((slot) => (
        <option key={slot.value} value={slot.value} disabled={slot.disabled}>
          {slot.label}
        </option>
      ))}
    </select>
  );
}
