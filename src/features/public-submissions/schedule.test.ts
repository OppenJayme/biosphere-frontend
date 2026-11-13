import { describe, expect, it } from "vitest";
import {
  MUSEUM_OPENING_HOURS,
  endTimeSlots,
  keepIfOffered,
  scheduleRowOptions,
  startTimeSlots,
  formatSchedule,
  formatTimeRange,
  museumClock,
  museumToday,
  normalizeTime,
  overlappingBookings,
  openingWindowsFor,
  readableServerMessage,
  scheduleTimeOptions,
  summarizeOpeningHours,
  validateSchedules,
  weeklyWindows,
} from "./schedule";

const TODAY = "2026-09-29";

describe("museumToday", () => {
  it("uses Asia/Manila, not UTC", () => {
    // 20:00 UTC on Sep 29 is already Sep 30 in Manila (UTC+8).
    expect(museumToday(new Date("2026-09-29T20:00:00Z"))).toBe("2026-09-30");
    expect(museumToday(new Date("2026-09-29T10:00:00Z"))).toBe("2026-09-29");
  });
});

describe("validateSchedules", () => {
  it("accepts valid future options", () => {
    const result = validateSchedules(
      [
        { date: "2026-10-15", startTime: "09:00", endTime: "11:00" },
        { date: TODAY, startTime: "13:00", endTime: "15:00" },
      ],
      TODAY,
    );
    expect(result.valid).toBe(true);
    expect(result.rowErrors).toEqual([undefined, undefined]);
  });

  it("flags incomplete, past, impossible, reversed, and duplicate rows", () => {
    const result = validateSchedules(
      [
        { date: "", startTime: "09:00", endTime: "10:00" },
        { date: "2026-09-28", startTime: "09:00", endTime: "10:00" },
        { date: "2026-02-30", startTime: "09:00", endTime: "10:00" },
        { date: "2026-10-01", startTime: "11:00", endTime: "11:00" },
        { date: "2026-10-01", startTime: "09:00", endTime: "10:00" },
      ],
      TODAY,
    );
    expect(result.valid).toBe(false);
    expect(result.rowErrors[0]).toMatch(/date, start time, and end time/);
    expect(result.rowErrors[1]).toMatch(/today or a later date/);
    expect(result.rowErrors[2]).toMatch(/real calendar date/);
    expect(result.rowErrors[3]).toMatch(/later than the start/);
    expect(result.rowErrors[4]).toBeUndefined();

    const duplicate = validateSchedules(
      [
        { date: "2026-10-01", startTime: "09:00", endTime: "10:00" },
        { date: "2026-10-01", startTime: "09:00", endTime: "10:00" },
      ],
      TODAY,
    );
    expect(duplicate.rowErrors[1]).toMatch(/repeats an earlier/);
  });

  it("requires between one and five options", () => {
    expect(validateSchedules([], TODAY).listError).toMatch(/at least one/);
    const six = Array.from({ length: 6 }, (_, index) => ({
      date: `2026-10-1${index}`,
      startTime: "09:00",
      endTime: "10:00",
    }));
    expect(validateSchedules(six, TODAY).listError).toMatch(/at most 5/);
  });
});

describe("museum hours, passed times, and booked times (backend spec 0001)", () => {
  // 2026-11-17 is a Tuesday, 2026-11-21 a Saturday, 2026-11-22 a Sunday.
  const CLOCK = { date: "2026-11-17", time: "10:15" };
  const option = (date: string, startTime: string, endTime: string) => ({ date, startTime, endTime });

  it("reads the museum clock in Asia/Manila", () => {
    expect(museumClock(new Date("2026-11-17T02:15:00Z"))).toEqual({ date: "2026-11-17", time: "10:15" });
    expect(museumClock(new Date("2026-11-17T16:30:00Z"))).toEqual({ date: "2026-11-18", time: "00:30" });
  });

  it("accepts times inside one opening window, including touching its edges", () => {
    const result = validateSchedules(
      [
        option("2026-11-18", "08:00", "11:00"),
        option("2026-11-18", "13:00", "16:00"),
        option("2026-11-21", "09:00", "10:30"),
      ],
      CLOCK,
    );
    expect(result.rowErrors).toEqual([undefined, undefined, undefined]);
  });

  it("rejects Sundays, the lunch break, closing time, and Saturday afternoons with the day's hours", () => {
    const result = validateSchedules(
      [
        option("2026-11-22", "09:00", "10:00"),
        option("2026-11-18", "10:30", "13:30"),
        option("2026-11-18", "15:00", "16:30"),
        option("2026-11-21", "13:00", "14:00"),
        option("2026-11-18", "07:30", "09:00"),
      ],
      CLOCK,
    );
    expect(result.valid).toBe(false);
    expect(result.rowErrors[0]).toBe("The museum is closed on Sundays. Choose another day.");
    expect(result.rowErrors[1]).toBe(
      "Choose a time inside the museum's Wednesday hours: 8:00 to 11:00 AM and 1:00 to 4:00 PM.",
    );
    expect(result.rowErrors[2]).toMatch(/Wednesday hours/);
    expect(result.rowErrors[3]).toBe("Choose a time inside the museum's Saturday hours: 8:00 to 11:00 AM.");
    expect(result.rowErrors[4]).toMatch(/Wednesday hours/);
  });

  it("rejects a start time that has already passed today, but not later today or tomorrow", () => {
    const result = validateSchedules(
      [option("2026-11-17", "09:00", "10:30"), option("2026-11-17", "10:15", "11:00"), option("2026-11-17", "13:00", "14:00")],
      CLOCK,
    );
    expect(result.rowErrors[0]).toMatch(/already passed today/);
    expect(result.rowErrors[1]).toMatch(/already passed today/);
    expect(result.rowErrors[2]).toBeUndefined();
    // A date only clock skips the time check, for callers that only know the date.
    expect(validateSchedules([option("2026-11-17", "09:00", "10:30")], "2026-11-17").rowErrors[0]).toBeUndefined();
  });

  it("rejects overlaps with booked times; touching times and other days are fine", () => {
    const booked = [{ date: "2026-11-18", startTime: "08:00", endTime: "09:30" }];
    const result = validateSchedules(
      [
        option("2026-11-18", "09:00", "10:00"),
        option("2026-11-18", "09:30", "11:00"),
        option("2026-11-19", "08:00", "09:30"),
        option("2026-11-18", "07:45", "08:00"),
      ],
      CLOCK,
      { booked },
    );
    expect(result.rowErrors[0]).toBe(
      "This time overlaps a visit already booked from 8:00 to 9:30 AM. Choose another time.",
    );
    expect(result.rowErrors[1]).toBeUndefined();
    expect(result.rowErrors[2]).toBeUndefined();
    // Outside hours wins over the overlap message, since that time can never be booked.
    expect(result.rowErrors[3]).toMatch(/Wednesday hours/);
    expect(overlappingBookings(option("2026-11-18", "08:30", "09:00"), booked)).toHaveLength(1);
  });

  it("uses the opening hours the availability endpoint returns when given", () => {
    const openingHours = [{ dayOfWeek: 0, start: "10:00", end: "12:00" }];
    expect(validateSchedules([option("2026-11-22", "10:00", "11:00")], CLOCK, { openingHours }).valid).toBe(true);
    expect(validateSchedules([option("2026-11-18", "09:00", "10:00")], CLOCK, { openingHours }).rowErrors[0]).toBe(
      "The museum is closed on Wednesdays. Choose another day.",
    );
  });

  it("summarizes the week of opening hours in plain words", () => {
    expect(summarizeOpeningHours(MUSEUM_OPENING_HOURS)).toBe(
      "Monday to Friday, 8:00 to 11:00 AM and 1:00 to 4:00 PM. Saturday, 8:00 to 11:00 AM. Closed on Sunday.",
    );
  });

  it("rewrites backend field paths as the form's option labels", () => {
    expect(readableServerMessage("preferredSchedules[0].startTime has already passed today.")).toBe(
      "Option 1 start time has already passed today.",
    );
    expect(
      readableServerMessage(
        "preferredSchedules[1] (2030-10-16 13:00-15:00) overlaps a visit that is already booked. Choose another time.",
      ),
    ).toBe("Option 2 (2030-10-16 13:00-15:00) overlaps a visit that is already booked. Choose another time.");
  });
});

describe("formatting", () => {
  it("formats short time ranges", () => {
    expect(formatTimeRange("08:00", "09:30")).toBe("8:00 to 9:30 AM");
    expect(formatTimeRange("10:00", "13:00")).toBe("10:00 AM to 1:00 PM");
  });

  it("drops seconds from time inputs", () => {
    expect(normalizeTime("09:30:00")).toBe("09:30");
    expect(normalizeTime("09:30")).toBe("09:30");
  });

  it("formats a schedule as a calendar date with 12-hour times", () => {
    expect(formatSchedule({ date: "2026-10-15", startTime: "09:00", endTime: "13:30" })).toBe(
      "Thu, Oct 15, 2026, 9:00 AM – 1:30 PM",
    );
  });
});

describe("12-hour schedule time options", () => {
  it("offers start times inside each window with 24-hour values and 12-hour labels", () => {
    const starts = scheduleTimeOptions(openingWindowsFor("2026-11-16"), "start");
    expect(starts[0]).toEqual({ value: "08:00", label: "8:00 AM" });
    expect(starts.at(-1)).toEqual({ value: "15:45", label: "3:45 PM" });
    expect(starts.find((option) => option.value === "13:00")?.label).toBe("1:00 PM");
    // Closing times and the lunch break are never offered as a start.
    expect(starts.map((option) => option.value)).not.toContain("11:00");
    expect(starts.map((option) => option.value)).not.toContain("12:00");
    expect(starts.map((option) => option.value)).not.toContain("16:00");
    expect(starts).toHaveLength(24);
  });

  it("offers end times up to closing but not at opening", () => {
    const ends = scheduleTimeOptions(openingWindowsFor("2026-11-16"), "end").map((option) => option.value);
    expect(ends[0]).toBe("08:15");
    expect(ends).toContain("11:00");
    expect(ends).toContain("16:00");
    expect(ends).not.toContain("08:00");
    expect(ends).not.toContain("13:00");
  });

  it("offers only the morning on Saturdays, and every window before a date is chosen", () => {
    const saturday = scheduleTimeOptions(openingWindowsFor("2026-11-21"), "end");
    expect(saturday.at(-1)).toEqual({ value: "11:00", label: "11:00 AM" });
    expect(weeklyWindows()).toEqual([
      { start: "08:00", end: "11:00" },
      { start: "13:00", end: "16:00" },
    ]);
  });

  it("keeps every offered option valid against the museum hours", () => {
    const starts = scheduleTimeOptions(openingWindowsFor("2026-11-16"), "start");
    const ends = scheduleTimeOptions(openingWindowsFor("2026-11-16"), "end");
    for (const start of starts) {
      const end = ends.find((option) => option.value > start.value)!;
      expect(validateSchedules([{ date: "2026-11-16", startTime: start.value, endTime: end.value }], TODAY).valid).toBe(true);
    }
  });
});

describe("time slot pickers (QA 2026-11-14: Saturday showed 6:00 AM to 5:00 PM)", () => {
  // 2026-11-14 is a Saturday (8:00 to 11:00 AM); 2026-11-16 a Monday (two windows); 2026-11-15 Sunday.
  const clock = { date: "2026-11-01", time: "09:00" };

  it("offers only times inside that day's opening hours", () => {
    const saturday = startTimeSlots("2026-11-14", {}, clock).map((slot) => slot.value);
    expect(saturday[0]).toBe("08:00");
    expect(saturday.at(-1)).toBe("10:45");
    expect(saturday).not.toContain("06:00");
    expect(saturday).not.toContain("11:00");
    expect(startTimeSlots("2026-11-15", {}, clock)).toEqual([]);
  });

  it("skips the lunch break on weekdays", () => {
    const monday = startTimeSlots("2026-11-16", {}, clock).map((slot) => slot.value);
    expect(monday).toContain("10:45");
    expect(monday).not.toContain("11:00");
    expect(monday).not.toContain("12:30");
    expect(monday).toContain("13:00");
    expect(monday.at(-1)).toBe("15:45");
  });

  it("ends a visit inside the same window as its start", () => {
    const ends = endTimeSlots("2026-11-16", "10:00").map((slot) => slot.value);
    expect(ends).toEqual(["10:15", "10:30", "10:45", "11:00"]);
  });

  it("disables booked and already-passed start times, and ends that run into a booking", () => {
    const booked = [{ date: "2026-11-16", startTime: "09:00", endTime: "10:00" }];
    const today = { date: "2026-11-16", time: "08:20" };
    const starts = startTimeSlots("2026-11-16", { booked }, today);
    expect(starts.find((slot) => slot.value === "08:15")).toMatchObject({ disabled: true, label: "8:15 AM (passed)" });
    expect(starts.find((slot) => slot.value === "08:30")?.disabled).toBe(false);
    expect(starts.find((slot) => slot.value === "09:30")).toMatchObject({ disabled: true, label: "9:30 AM (booked)" });
    expect(starts.find((slot) => slot.value === "10:00")?.disabled).toBe(false);

    const ends = endTimeSlots("2026-11-16", "08:30", { booked });
    expect(ends.find((slot) => slot.value === "09:00")?.disabled).toBe(false);
    expect(ends.find((slot) => slot.value === "09:15")?.disabled).toBe(true);
  });
});

describe("schedule row options (combined #152 and #155 pickers)", () => {
  const clock = { date: "2026-11-01", time: "09:00" };
  const today = "2026-11-01";

  it("offers every weekly time before a date is chosen", () => {
    const options = scheduleRowOptions({ date: "", startTime: "" }, today, {}, clock);
    expect(options.start.map((option) => option.value)).toEqual(
      scheduleTimeOptions(weeklyWindows(), "start").map((option) => option.value),
    );
  });

  it("narrows to that day's bookable times once a date is chosen", () => {
    const booked = [{ date: "2026-11-21", startTime: "08:00", endTime: "09:00" }];
    const options = scheduleRowOptions({ date: "2026-11-21", startTime: "09:00" }, today, { booked }, clock);
    expect(options.start[0]).toMatchObject({ value: "08:00", label: "8:00 AM (booked)", disabled: true });
    expect(options.start.at(-1)?.value).toBe("10:45");
    expect(options.end.map((option) => option.value)).toEqual(["09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00"]);
  });

  it("keeps a picked time only while it is still an enabled choice", () => {
    const sunday = scheduleRowOptions({ date: "2026-11-22", startTime: "" }, today, {}, clock);
    expect(keepIfOffered("09:00", sunday.start)).toBe("");
    const monday = scheduleRowOptions({ date: "2026-11-23", startTime: "" }, today, {}, clock);
    expect(keepIfOffered("14:00", monday.start)).toBe("14:00");
    const booked = scheduleRowOptions({ date: "2026-11-23", startTime: "" }, today, {
      booked: [{ date: "2026-11-23", startTime: "14:00", endTime: "15:00" }],
    }, clock);
    expect(keepIfOffered("14:00", booked.start)).toBe("");
  });

  it("submits 24-hour HH:MM values and shows 12-hour labels", () => {
    const options = scheduleRowOptions({ date: "2026-11-23", startTime: "13:00" }, today, {}, clock);
    expect(options.start.find((option) => option.value === "13:00")?.label).toBe("1:00 PM");
    expect(options.end.every((option) => /^\d{2}:\d{2}$/.test(option.value))).toBe(true);
  });
});
