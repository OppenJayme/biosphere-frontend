import { describe, expect, it } from "vitest";
import {
  addDays,
  eventsByDate,
  filterCalendarEvents,
  formatMonthLabel,
  monthGrid,
  monthGridRange,
  parseMonth,
  shiftMonth,
  visitCalendarSchema,
  type VisitCalendarEvent,
} from "./calendar";

function event(overrides: Partial<VisitCalendarEvent>): VisitCalendarEvent {
  return {
    id: "5589315f-81fb-49a7-8b1c-df177703e1de",
    referenceCode: "5589315F",
    status: "APPROVED_BY_CURATOR",
    organization: "Synthetic Science High School",
    contactPerson: "Synthetic Contact",
    visitorCount: 24,
    date: "2026-11-17",
    startTime: "08:00",
    endTime: "09:30",
    ...overrides,
  };
}

describe("month helpers", () => {
  it("accepts only real YYYY-MM months from the URL", () => {
    expect(parseMonth("2026-11")).toBe("2026-11");
    expect(parseMonth("2026-13")).toBeUndefined();
    expect(parseMonth("2026-1")).toBeUndefined();
    expect(parseMonth("../2026-11")).toBeUndefined();
    expect(parseMonth(undefined)).toBeUndefined();
  });

  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("covers the month in whole Sunday first weeks", () => {
    // November 2026 starts on a Sunday and ends on a Monday: 5 weeks.
    const november = monthGrid("2026-11");
    expect(november).toHaveLength(5);
    expect(november[0][0]).toBe("2026-11-01");
    expect(november[4][6]).toBe("2026-12-05");
    expect(november.every((week) => week.length === 7)).toBe(true);

    // August 2026 starts on a Saturday and needs 6 weeks.
    const august = monthGrid("2026-08");
    expect(august).toHaveLength(6);
    expect(august[0][0]).toBe("2026-07-26");
    expect(august[0][6]).toBe("2026-08-01");

    expect(monthGridRange("2026-11")).toEqual({ from: "2026-11-01", to: "2026-12-05" });
  });

  it("labels months as calendar months, not shifted by the time zone", () => {
    expect(formatMonthLabel("2026-11")).toBe("November 2026");
    expect(formatMonthLabel("2027-01")).toBe("January 2027");
  });
});

describe("calendar events", () => {
  it("parses the backend calendar response", () => {
    expect(visitCalendarSchema.parse([event({})])).toHaveLength(1);
    expect(() => visitCalendarSchema.parse([{ ...event({}), id: "not-a-uuid" }])).toThrow();
  });

  it("groups events by date in start time order", () => {
    const grouped = eventsByDate([
      event({ id: "11111111-1111-4111-8111-111111111111", startTime: "13:00", endTime: "14:00" }),
      event({ id: "22222222-2222-4222-8222-222222222222", startTime: "08:00", endTime: "09:00" }),
      event({ id: "33333333-3333-4333-8333-333333333333", date: "2026-11-18" }),
    ]);
    expect(grouped.get("2026-11-17")?.map((item) => item.startTime)).toEqual(["08:00", "13:00"]);
    expect(grouped.get("2026-11-18")).toHaveLength(1);
  });

  it("applies the status chip and search box", () => {
    const events = [
      event({ id: "11111111-1111-4111-8111-111111111111", organization: "Cebu Normal Class" }),
      event({
        id: "22222222-2222-4222-8222-222222222222",
        status: "COMPLETED",
        referenceCode: "ABCD1234",
      }),
    ];
    expect(filterCalendarEvents(events, { status: "", search: "" })).toHaveLength(2);
    expect(filterCalendarEvents(events, { status: "COMPLETED", search: "" })).toHaveLength(1);
    expect(filterCalendarEvents(events, { status: "", search: "cebu" })[0].organization).toBe("Cebu Normal Class");
    expect(filterCalendarEvents(events, { status: "", search: "abcd" })).toHaveLength(1);
    expect(filterCalendarEvents(events, { status: "PENDING", search: "" })).toHaveLength(0);
  });
});
