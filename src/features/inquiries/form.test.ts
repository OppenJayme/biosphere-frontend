import { describe, expect, it } from "vitest";
import { readInquiryForm } from "./form";
import { readReferralForm } from "./referral-form";

function formData(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

describe("readInquiryForm", () => {
  const valid = {
    name: "  Juan Dela Cruz ",
    email: "juan@school.edu.ph",
    phone: "",
    organization: "",
    inquiryType: "TOUR",
    message: "Can we visit on a weekday?",
    consent: "on",
  };

  it("builds the POST body, omitting blank optional fields and never sending address", () => {
    const result = readInquiryForm(formData({ ...valid, address: "Cebu" }));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      name: "Juan Dela Cruz",
      email: "juan@school.edu.ph",
      phone: undefined,
      organization: undefined,
      inquiryType: "TOUR",
      message: "Can we visit on a weekday?",
      consentAccepted: true,
    });
    const body = JSON.parse(JSON.stringify(result.data));
    expect(Object.keys(body).sort()).toEqual(["consentAccepted", "email", "inquiryType", "message", "name"]);
  });

  it("requires consent, a valid email, a message, and a well-formed phone", () => {
    const result = readInquiryForm(
      formData({ ...valid, consent: "", email: "not-an-email", message: "  ", phone: "abc" }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.errors).sort()).toEqual(["consent", "email", "message", "phone"]);
  });

  it("rejects unknown topics and overlong messages", () => {
    const result = readInquiryForm(formData({ ...valid, inquiryType: "HACK", message: "x".repeat(2001) }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.inquiryType).toBeDefined();
    expect(result.errors.message).toMatch(/2000/);
  });
});

describe("readReferralForm", () => {
  const schedules = { scheduleDate: ["2026-10-15"], scheduleStart: ["09:00"], scheduleEnd: ["11:00"] };

  it("omits blank phone and organization so the backend uses the inquiry's", () => {
    const result = readReferralForm(
      formData({ phone: "", organization: "", purpose: "", visitorCount: "12", note: "", ...schedules }),
      { phone: false, organization: false },
      "2026-09-29",
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(JSON.parse(JSON.stringify(result.data))).toEqual({
      visitorCount: 12,
      preferredSchedules: [{ date: "2026-10-15", startTime: "09:00", endTime: "11:00" }],
    });
  });

  it("requires phone and organization when the inquiry has none, and echoes the values back", () => {
    const result = readReferralForm(
      formData({ phone: "", organization: "", purpose: "Tour", visitorCount: "0", note: "", ...schedules }),
      { phone: true, organization: true },
      "2026-09-29",
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.phone).toMatch(/no contact number/);
    expect(result.errors.organization).toMatch(/no organization/);
    expect(result.errors.visitorCount).toBeDefined();
    expect(result.values.purpose).toBe("Tour");
    expect(result.values.scheduleDate).toEqual(["2026-10-15"]);
  });
});
