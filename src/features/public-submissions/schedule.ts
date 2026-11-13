/**
 * Preferred-schedule rules shared by the public visit form and the curator referral form.
 * They mirror the backend's checks (REQ-4.9-02/03, backend spec 0001 AC-1 to AC-3) so visitors
 * see problems before submitting; the backend stays the authority.
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

/** The museum's date and wall clock time ("HH:MM", 24 hour), which the backend uses for "already passed". */
export type MuseumClock = { date: string; time: string };

export function museumClock(now = new Date()): MuseumClock {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return { date: museumToday(now), time };
}

/** One opening window; dayOfWeek is 0 for Sunday through 6 for Saturday, like the backend. */
export type OpeningWindow = { dayOfWeek: number; start: string; end: string };

/** A time a curator approved visit already holds (the availability endpoint's `booked`). */
export type BookedRange = { date: string; startTime: string; endTime: string };

/**
 * Museum hours from the public footer (given by the museum on 2026-11-07), mirroring the backend's
 * MUSEUM_OPENING_HOURS. The public form prefers the hours the availability endpoint returns; this
 * copy covers the curator referral form and the moment before availability loads. If the museum
 * changes its hours, update the backend constant, this list, and PublicFooter together.
 */
const WEEKDAY_WINDOWS = [
  { start: "08:00", end: "11:00" },
  { start: "13:00", end: "16:00" },
];
export const MUSEUM_OPENING_HOURS: readonly OpeningWindow[] = [
  ...[1, 2, 3, 4, 5].flatMap((dayOfWeek) => WEEKDAY_WINDOWS.map((window) => ({ dayOfWeek, ...window }))),
  { dayOfWeek: 6, start: "08:00", end: "11:00" },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekday of a YYYY-MM-DD calendar date, read in UTC so the browser's own zone never shifts it. */
export function dayOfWeek(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
}

export function dayName(date: string) {
  return DAY_NAMES[dayOfWeek(date)];
}

/** That day's opening windows, earliest first; empty when the museum is closed. */
export function openingWindowsFor(date: string, hours: readonly OpeningWindow[] = MUSEUM_OPENING_HOURS) {
  const day = dayOfWeek(date);
  return hours.filter((window) => window.dayOfWeek === day).sort((a, b) => a.start.localeCompare(b.start));
}

/** "8:00 AM to 11:00 AM and 1:00 PM to 4:00 PM", or "" when closed. */
export function describeWindows(windows: readonly { start: string; end: string }[]) {
  return windows.map((window) => formatTimeRange(window.start, window.end)).join(" and ");
}

/** True when the option sits entirely inside one opening window for its weekday. */
export function fitsOpeningHours(schedule: ScheduleInput, hours: readonly OpeningWindow[] = MUSEUM_OPENING_HOURS) {
  return openingWindowsFor(schedule.date, hours).some(
    (window) => schedule.startTime >= window.start && schedule.endTime <= window.end,
  );
}

/** Booked ranges on the option's date that overlap it. Touching ends (one ends as the other starts) do not overlap. */
export function overlappingBookings(schedule: ScheduleInput, booked: readonly BookedRange[]) {
  return booked.filter(
    (range) =>
      range.date === schedule.date && range.startTime < schedule.endTime && range.endTime > schedule.startTime,
  );
}

/**
 * Start times for a chosen date: every SCHEDULE_TIME_STEP inside that day's opening windows (a
 * closed day returns none). Times an approved visit already holds, or that have passed today, are
 * listed but disabled, so a visitor cannot pick an unbookable slot.
 */
export function startTimeSlots(
  date: string,
  rules: ScheduleRules = {},
  clock: MuseumClock = museumClock(),
): TimeOption[] {
  const booked = (rules.booked ?? []).filter((range) => range.date === date);
  return scheduleTimeOptions(openingWindowsFor(date, rules.openingHours ?? MUSEUM_OPENING_HOURS), "start").map(
    (option) => {
      const passed = date < clock.date || (date === clock.date && option.value <= clock.time);
      const taken = booked.some((range) => range.startTime <= option.value && option.value < range.endTime);
      const suffix = taken ? " (booked)" : passed ? " (passed)" : "";
      return { ...option, label: `${option.label}${suffix}`, disabled: passed || taken };
    },
  );
}

/**
 * End times for a visit starting at `startTime` on `date`: later steps up to the end of the same
 * opening window, so a range never crosses the lunch break or closing time. Ends that would run
 * into the next approved visit are disabled.
 */
export function endTimeSlots(date: string, startTime: string, rules: ScheduleRules = {}): TimeOption[] {
  if (!TIME_PATTERN.test(startTime)) return [];
  const window = openingWindowsFor(date, rules.openingHours ?? MUSEUM_OPENING_HOURS).find(
    (item) => startTime >= item.start && startTime < item.end,
  );
  if (!window) return [];
  const nextBooking = (rules.booked ?? [])
    .filter((range) => range.date === date && range.startTime >= startTime)
    .map((range) => range.startTime)
    .sort()[0];
  return scheduleTimeOptions([{ start: startTime, end: window.end }], "end").map((option) => {
    const overlaps = nextBooking !== undefined && option.value > nextBooking;
    return { ...option, label: `${option.label}${overlaps ? " (booked)" : ""}`, disabled: overlaps };
  });
}

/**
 * The start and end choices for one schedule row. Before a date is chosen every weekly opening
 * time is offered (#152), so a visitor can fill the row in any order; once the date is known only
 * that day's bookable times are, with the end tied to the chosen start.
 */
export function scheduleRowOptions(
  row: { date: string; startTime: string },
  today: string,
  rules: ScheduleRules = {},
  clock: MuseumClock = museumClock(),
): { start: TimeOption[]; end: TimeOption[] } {
  const hours = rules.openingHours ?? MUSEUM_OPENING_HOURS;
  if (!DATE_PATTERN.test(row.date) || !isRealDate(row.date) || row.date < today) {
    return {
      start: scheduleTimeOptions(weeklyWindows(hours), "start"),
      end: scheduleTimeOptions(weeklyWindows(hours), "end"),
    };
  }
  const start = startTimeSlots(row.date, rules, clock);
  const end = row.startTime
    ? endTimeSlots(row.date, row.startTime, rules)
    : scheduleTimeOptions(openingWindowsFor(row.date, hours), "end");
  return { start, end };
}

/** `value` when it is still an enabled choice, otherwise "" (used when the date or start changes). */
export function keepIfOffered(value: string, options: readonly TimeOption[]) {
  return options.some((option) => option.value === value && !option.disabled) ? value : "";
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

export type ScheduleRules = {
  /** Opening hours to check against; defaults to MUSEUM_OPENING_HOURS. */
  openingHours?: readonly OpeningWindow[];
  /** Times already held by approved visits; an option overlapping one is rejected. */
  booked?: readonly BookedRange[];
};

/**
 * Validates the schedule rows in order. Returns one message per row (undefined when the row is
 * fine) plus a list-level message for count problems.
 *
 * `clock` is the museum's current date and time. A plain date string checks the date only (no
 * "start time already passed" check), for callers that only know the date.
 */
export function validateSchedules(
  schedules: ScheduleInput[],
  clock: MuseumClock | string = museumClock(),
  rules: ScheduleRules = {},
) {
  const today = typeof clock === "string" ? clock : clock.date;
  const nowTime = typeof clock === "string" ? undefined : clock.time;
  const openingHours = rules.openingHours ?? MUSEUM_OPENING_HOURS;
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
    } else if (date === today && nowTime && startTime <= nowTime) {
      error = "That start time has already passed today. Choose a later time or another date.";
    } else if (!fitsOpeningHours(schedule, openingHours)) {
      const windows = openingWindowsFor(date, openingHours);
      error =
        windows.length === 0
          ? `The museum is closed on ${dayName(date)}s. Choose another day.`
          : `Choose a time inside the museum's ${dayName(date)} hours: ${describeWindows(windows)}.`;
    } else if (rules.booked && overlappingBookings(schedule, rules.booked).length > 0) {
      const [taken] = overlappingBookings(schedule, rules.booked);
      error = `This time overlaps a visit already booked from ${formatTimeRange(taken.startTime, taken.endTime)}. Choose another time.`;
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

/** Minutes between the times offered in the schedule time pickers. */
export const SCHEDULE_TIME_STEP = 15;

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Every distinct opening window in the week, for a time picker before a date is chosen. */
export function weeklyWindows(hours: readonly OpeningWindow[] = MUSEUM_OPENING_HOURS) {
  const seen = new Map<string, { start: string; end: string }>();
  for (const { start, end } of hours) seen.set(`${start}-${end}`, { start, end });
  return [...seen.values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

/** One picker choice. Disabled choices (booked or passed) stay visible so the day reads whole. */
export type TimeOption = { value: string; label: string; disabled?: boolean };

/**
 * The times a visitor can pick inside the given opening windows, every `step` minutes. Values stay
 * 24-hour "HH:MM" (what the API takes); labels are 12-hour ("1:30 PM") like the hours text, so the
 * form never mixes the two formats. A start can't be a window's closing time and an end can't be
 * its opening time, since neither leaves room for a visit.
 */
export function scheduleTimeOptions(
  windows: readonly { start: string; end: string }[],
  kind: "start" | "end",
  step = SCHEDULE_TIME_STEP,
): TimeOption[] {
  const values = new Set<string>();
  for (const window of windows) {
    const first = toMinutes(window.start) + (kind === "end" ? step : 0);
    const last = toMinutes(window.end) - (kind === "start" ? step : 0);
    for (let minute = first; minute <= last; minute += step) values.add(fromMinutes(minute));
  }
  return [...values].sort().map((value) => ({ value, label: formatScheduleTime(value) }));
}

/**
 * Backend messages name fields by their API path ("preferredSchedules[1].startTime has already
 * passed today."); say "Option 2 start time" instead, matching the forms' own labels.
 */
export function readableServerMessage(message: string) {
  return message.replace(
    /preferredSchedules\[(\d+)\](?:\.(startTime|endTime|date))?/g,
    (_match, index: string, field?: string) => {
      const option = `Option ${Number(index) + 1}`;
      if (field === "startTime") return `${option} start time`;
      if (field === "endTime") return `${option} end time`;
      if (field === "date") return `${option} date`;
      return option;
    },
  );
}

/** "08:00", "09:30" -> "8:00 to 9:30 AM"; keeps both suffixes when the range crosses noon. */
export function formatTimeRange(start: string, end: string) {
  const from = formatScheduleTime(start);
  const to = formatScheduleTime(end);
  const sameHalf = from.slice(-2) === to.slice(-2);
  return `${sameHalf ? from.slice(0, -3) : from} to ${to}`;
}

/**
 * "Monday to Friday, 8:00 to 11:00 AM and 1:00 to 4:00 PM. Saturday, 8:00 to 11:00 AM. Closed on
 * Sunday." Consecutive days with the same windows are grouped, starting from Monday.
 */
export function summarizeOpeningHours(hours: readonly OpeningWindow[] = MUSEUM_OPENING_HOURS) {
  const week = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    day,
    text: describeWindows(
      hours.filter((window) => window.dayOfWeek === day).sort((a, b) => a.start.localeCompare(b.start)),
    ),
  }));
  const groups: { first: number; last: number; text: string }[] = [];
  for (const { day, text } of week) {
    const last = groups.at(-1);
    if (last && last.text === text) last.last = day;
    else groups.push({ first: day, last: day, text });
  }
  return groups
    .map(({ first, last, text }) => {
      const days = first === last ? DAY_NAMES[first] : `${DAY_NAMES[first]} to ${DAY_NAMES[last]}`;
      return text ? `${days}, ${text}.` : `Closed on ${days}.`;
    })
    .join(" ");
}

export function formatSchedule(schedule: ScheduleInput) {
  return `${formatScheduleDate(schedule.date)}, ${formatScheduleTime(schedule.startTime)} – ${formatScheduleTime(schedule.endTime)}`;
}
