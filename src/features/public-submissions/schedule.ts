/**
 * Preferred-schedule rules shared by the public visit form and the curator referral form.
 * They mirror the backend's checks (REQ-4.9-02/03) so visitors see problems before submitting;
 * the backend stays the authority.
 */

export const MAX_PREFERRED_SCHEDULES = 5;
export const MAX_VISITOR_COUNT = 200;

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ScheduleInput = { date: string; startTime: string; endTime: string };

/** Today's date (YYYY-MM-DD) at the museum, which is what the backend compares against. */
export function museumToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function isRealDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Browsers may send "HH:MM:SS" from a time input; the API takes "HH:MM". */
export function normalizeTime(value: string) {
  return /^\d{2}:\d{2}:\d{2}$/.test(value) ? value.slice(0, 5) : value;
}

/**
 * Validates the schedule rows in order. Returns one message per row (undefined when the row is
 * fine) plus a list-level message for count problems.
 */
export function validateSchedules(schedules: ScheduleInput[], today = museumToday()) {
  const rowErrors: (string | undefined)[] = [];
  const seen = new Set<string>();

  for (const schedule of schedules) {
    const { date, startTime, endTime } = schedule;
    let error: string | undefined;

    if (!date || !startTime || !endTime) {
      error = "Choose a date, start time, and end time.";
    } else if (!DATE_PATTERN.test(date) || !isRealDate(date)) {
      error = "Enter a real calendar date.";
    } else if (date < today) {
      error = "Choose today or a later date.";
    } else if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      error = "Enter times as hours and minutes.";
    } else if (endTime <= startTime) {
      error = "The end time must be later than the start time.";
    } else {
      const key = `${date} ${startTime}-${endTime}`;
      if (seen.has(key)) error = "This option repeats an earlier one.";
      seen.add(key);
    }

    rowErrors.push(error);
  }

  let listError: string | undefined;
  if (schedules.length === 0) listError = "Add at least one preferred schedule.";
  if (schedules.length > MAX_PREFERRED_SCHEDULES) {
    listError = `Add at most ${MAX_PREFERRED_SCHEDULES} preferred schedules.`;
  }

  return { rowErrors, listError, valid: !listError && rowErrors.every((error) => !error) };
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-15" -> "Thu, Oct 15, 2026". Dates are calendar dates, so format them in UTC. */
export function formatScheduleDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

/** "13:30" -> "1:30 PM". */
export function formatScheduleTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatSchedule(schedule: ScheduleInput) {
  return `${formatScheduleDate(schedule.date)}, ${formatScheduleTime(schedule.startTime)} – ${formatScheduleTime(schedule.endTime)}`;
}
