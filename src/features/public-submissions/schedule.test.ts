import { describe, expect, it } from "vitest";
import { formatSchedule, museumToday, normalizeTime, validateSchedules } from "./schedule";

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

describe("formatting", () => {
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
